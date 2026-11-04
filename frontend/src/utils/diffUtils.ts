/**
 * Word-level and line-level diff utilities for the visual revision diff viewer.
 */

export interface DiffWordToken {
  text: string;
  type: "same" | "added" | "removed";
}

/**
 * Tokenize a line into words, spaces, and punctuation tokens.
 */
function tokenizeWords(str: string): string[] {
  return str.match(/\w+|\s+|[^\w\s]+/g) || [];
}

/**
 * Computes word-level diff between an old string and a new string using
 * Longest Common Subsequence (LCS) dynamic programming.
 */
export function computeWordDiff(oldStr: string, newStr: string): {
  oldTokens: DiffWordToken[];
  newTokens: DiffWordToken[];
} {
  const oldWords = tokenizeWords(oldStr);
  const newWords = tokenizeWords(newStr);

  const m = oldWords.length;
  const n = newWords.length;

  // If one string is very large (> 250 tokens), avoid O(m*n) table allocation
  if (m * n > 60000) {
    return {
      oldTokens: [{ text: oldStr, type: "removed" }],
      newTokens: [{ text: newStr, type: "added" }],
    };
  }

  // DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble tokens
  const oldTokens: DiffWordToken[] = [];
  const newTokens: DiffWordToken[] = [];

  let i = m;
  let j = n;

  const revOld: DiffWordToken[] = [];
  const revNew: DiffWordToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      revOld.push({ text: oldWords[i - 1], type: "same" });
      revNew.push({ text: newWords[j - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      revNew.push({ text: newWords[j - 1], type: "added" });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      revOld.push({ text: oldWords[i - 1], type: "removed" });
      i--;
    }
  }

  oldTokens.push(...revOld.reverse());
  newTokens.push(...revNew.reverse());

  return { oldTokens, newTokens };
}

export interface SplitDiffRow {
  leftLineNum?: number;
  leftText?: string;
  leftType?: "removed" | "context" | "empty";
  leftTokens?: DiffWordToken[];
  rightLineNum?: number;
  rightText?: string;
  rightType?: "added" | "context" | "empty";
  rightTokens?: DiffWordToken[];
  isHeader?: boolean;
  headerText?: string;
}

export interface UnifiedDiffRow {
  oldLineNum?: number;
  newLineNum?: number;
  type: "added" | "removed" | "context" | "header";
  text: string;
}

/**
 * Parses raw unified diff string into aligned rows for split (side-by-side) view
 * with word-level diffs calculated for modified lines.
 */
export function parseSplitDiff(unifiedDiff: string): SplitDiffRow[] {
  if (!unifiedDiff) return [];
  const rawDiffLines = unifiedDiff.split("\n");
  const rows: SplitDiffRow[] = [];

  let leftLine = 0;
  let rightLine = 0;

  let pendingLeft: { lineNum: number; text: string }[] = [];
  let pendingRight: { lineNum: number; text: string }[] = [];

  const flushPending = () => {
    const maxLen = Math.max(pendingLeft.length, pendingRight.length);
    for (let i = 0; i < maxLen; i++) {
      const leftItem = pendingLeft[i];
      const rightItem = pendingRight[i];

      let leftTokens: DiffWordToken[] | undefined;
      let rightTokens: DiffWordToken[] | undefined;

      if (leftItem && rightItem) {
        const wordDiff = computeWordDiff(leftItem.text, rightItem.text);
        leftTokens = wordDiff.oldTokens;
        rightTokens = wordDiff.newTokens;
      }

      rows.push({
        leftLineNum: leftItem ? leftItem.lineNum : undefined,
        leftText: leftItem ? leftItem.text : undefined,
        leftType: leftItem ? "removed" : "empty",
        leftTokens,
        rightLineNum: rightItem ? rightItem.lineNum : undefined,
        rightText: rightItem ? rightItem.text : undefined,
        rightType: rightItem ? "added" : "empty",
        rightTokens,
      });
    }
    pendingLeft = [];
    pendingRight = [];
  };

  for (let i = 0; i < rawDiffLines.length; i++) {
    const line = rawDiffLines[i];

    // Ignore file diff headers
    if (line.startsWith("---") || line.startsWith("+++")) {
      continue;
    }

    // Hunk header: @@ -from,count +to,count @@
    if (line.startsWith("@@")) {
      flushPending();
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        leftLine = parseInt(match[1], 10) - 1;
        rightLine = parseInt(match[2], 10) - 1;
      }
      rows.push({
        isHeader: true,
        headerText: line,
      });
      continue;
    }

    if (line.startsWith("-")) {
      leftLine++;
      pendingLeft.push({ lineNum: leftLine, text: line.slice(1) });
    } else if (line.startsWith("+")) {
      rightLine++;
      pendingRight.push({ lineNum: rightLine, text: line.slice(1) });
    } else {
      flushPending();
      leftLine++;
      rightLine++;
      const content = line.startsWith(" ") ? line.slice(1) : line;
      rows.push({
        leftLineNum: leftLine,
        leftText: content,
        leftType: "context",
        rightLineNum: rightLine,
        rightText: content,
        rightType: "context",
      });
    }
  }

  flushPending();
  return rows;
}

/**
 * Parses raw unified diff string into line-by-line rows for unified view
 * with accurate old and new line numbers.
 */
export function parseUnifiedDiff(unifiedDiff: string): UnifiedDiffRow[] {
  if (!unifiedDiff) return [];
  const lines = unifiedDiff.split("\n");
  const rows: UnifiedDiffRow[] = [];

  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith("---") || line.startsWith("+++")) {
      continue;
    }

    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10) - 1;
        newLine = parseInt(match[2], 10) - 1;
      }
      rows.push({
        type: "header",
        text: line,
      });
      continue;
    }

    if (line.startsWith("-")) {
      oldLine++;
      rows.push({
        oldLineNum: oldLine,
        type: "removed",
        text: line.slice(1),
      });
    } else if (line.startsWith("+")) {
      newLine++;
      rows.push({
        newLineNum: newLine,
        type: "added",
        text: line.slice(1),
      });
    } else {
      oldLine++;
      newLine++;
      rows.push({
        oldLineNum: oldLine,
        newLineNum: newLine,
        type: "context",
        text: line.startsWith(" ") ? line.slice(1) : line,
      });
    }
  }

  return rows;
}
