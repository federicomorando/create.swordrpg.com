/**
 * Pure SwORD check engine - zero Foundry dependencies.
 * Implements the 9-step pipeline from sword-engine-spec.json EngineCore.
 *
 * Pipeline: validateInput -> rollDice -> applyExtraDiceDiscards ->
 *   applyGradeReductions -> computeSum -> computeSuccesses ->
 *   applyModifiers -> evaluateDifficulty -> evaluateOpposed
 */

/**
 * Resolve a SwORD check using the 9-step pipeline.
 * @param {object} input - Check input per EngineCore.inputSchema
 * @returns {object} Check output per EngineCore.outputSchema
 */
export function swordCheckResolve(input) {
  const {
    characteristicScore,
    diceCount,
    grade,
    extraDice,
    successBonus = 0,
    successPenalty = 0,
    difficultyThreshold = null,
    opposedSuccesses = null,
    diceRolled,
    discardIndices = null
  } = input;

  // Step 1: validateInput
  // Note: diceCount >= 2 is an adapter-level rule (player must pick at least 2).
  // The engine allows diceCount >= 0 to support edge case EDGE-001 (all dice discarded).
  if (diceRolled.length !== diceCount + extraDice) {
    throw new Error(
      `diceRolled.length (${diceRolled.length}) must equal diceCount + extraDice (${diceCount + extraDice})`
    );
  }
  for (const d of diceRolled) {
    if (d < 1 || d > 6) throw new Error(`Die value ${d} out of range [1,6]`);
  }
  if (discardIndices !== null) {
    if (discardIndices.length > extraDice) {
      throw new Error(
        `discardIndices.length (${discardIndices.length}) must not exceed extraDice (${extraDice})`
      );
    }
    for (const idx of discardIndices) {
      if (idx < 0 || idx >= diceRolled.length) {
        throw new Error(`Invalid discard index: ${idx}`);
      }
    }
  }

  // Step 2: rollDice (passthrough — dice are pre-rolled by adapter)
  const diceOriginal = [...diceRolled];

  // Step 3: applyExtraDiceDiscards
  let diceAfterDiscards;
  if (extraDice === 0) {
    diceAfterDiscards = [...diceOriginal];
  } else if (discardIndices !== null) {
    const discardSet = new Set(discardIndices);
    diceAfterDiscards = diceOriginal.filter((_, i) => !discardSet.has(i));
  } else {
    // Smart auto-discard: keep all dice when sum already fits (maximizes 1s count).
    // Otherwise discard highest non-1 values first, stopping as soon as sum fits.
    const totalSum = diceOriginal.reduce((s, d) => s + d, 0);
    if (totalSum <= characteristicScore) {
      // Already passing — keep all dice to maximize ones count
      diceAfterDiscards = [...diceOriginal];
    } else {
      // Must discard some. Prefer highest non-1 values (they hurt sum without being 1s).
      // Stop as soon as sum fits, to keep as many dice (especially 1s) as possible.
      const indexed = diceOriginal.map((v, i) => ({ v, i }));
      indexed.sort((a, b) => {
        if (a.v === 1 && b.v !== 1) return 1;   // 1s last
        if (a.v !== 1 && b.v === 1) return -1;   // non-1s first
        return b.v - a.v;                         // descending within group
      });
      const discardSet = new Set();
      let runningSum = totalSum;
      for (let d = 0; d < extraDice; d++) {
        if (runningSum <= characteristicScore) break;  // already fits — stop discarding
        discardSet.add(indexed[d].i);
        runningSum -= indexed[d].v;
      }
      diceAfterDiscards = diceOriginal.filter((_, i) => !discardSet.has(i));
    }
  }

  // Step 4: applyGradeReductions (reduceLowestNonOneFirst)
  const diceAfterReduction = [...diceAfterDiscards];
  let gradesRemaining = grade;
  let gradesUsed = 0;

  while (gradesRemaining > 0) {
    let minVal = Infinity;
    let minIdx = -1;
    for (let i = 0; i < diceAfterReduction.length; i++) {
      if (diceAfterReduction[i] > 1 && diceAfterReduction[i] < minVal) {
        minVal = diceAfterReduction[i];
        minIdx = i;
      }
    }
    if (minIdx === -1) break; // All dice are already 1
    diceAfterReduction[minIdx] -= 1;
    gradesRemaining -= 1;
    gradesUsed += 1;
  }

  // Step 5: computeSum
  const finalSum = diceAfterReduction.reduce((s, d) => s + d, 0);

  // Step 6: computeSuccesses
  const basePassed = finalSum <= characteristicScore;
  const onesCount = diceAfterReduction.filter(d => d === 1).length;
  const rawSuccesses = basePassed ? 1 + onesCount : 0;

  // Step 7: applyModifiers
  const finalSuccesses = Math.max(0, rawSuccesses + successBonus - successPenalty);

  // Step 8: evaluateDifficulty
  const difficultyPassed =
    difficultyThreshold !== null ? finalSuccesses >= difficultyThreshold : null;

  // Step 9: evaluateOpposed
  const netSuccesses =
    opposedSuccesses !== null ? finalSuccesses - opposedSuccesses : null;

  return {
    diceOriginal,
    diceAfterDiscards,
    diceAfterReduction,
    gradesUsed,
    gradesRemaining,
    finalSum,
    characteristicScore,
    basePassed,
    onesCount,
    rawSuccesses,
    successBonus,
    successPenalty,
    finalSuccesses,
    difficultyThreshold,
    difficultyPassed,
    opposedSuccesses,
    netSuccesses
  };
}
