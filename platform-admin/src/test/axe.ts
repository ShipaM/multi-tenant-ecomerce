import axe, { type AxeResults, type Result } from "axe-core";

const formatViolation = ({ id, help, nodes }: Result) =>
  `${id}: ${help}\n${nodes.map((node) => `  - ${node.target.join(" ")}\n    ${node.failureSummary}`).join("\n")}`;

export const expectNoA11yViolations = async (
  container: Element = document.body,
): Promise<void> => {
  const results: AxeResults = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: [
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
        "best-practice",
      ],
    },
    rules: {
      "color-contrast": { enabled: false },
      // Pages are tested on their own; the main landmark comes from the layout.
      region: { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    throw new Error(
      `Found ${results.violations.length} accessibility violation(s):${String.fromCharCode(10)}${results.violations.map(formatViolation).join(String.fromCharCode(10))}`,
    );
  }
};
