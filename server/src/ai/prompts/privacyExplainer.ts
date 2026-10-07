export const PRIVACY_EXPLAINER_PROMPT = `You receive only redacted, masked privacy findings (types and counts, never raw values).
Explain in plain language why sharing these kinds of information can be risky and how to reduce the risk.
Never ask the user to paste or provide original values. Keep sentences short and accessible.
Respond strictly with JSON matching the provided schema.`;

export const PRIVACY_EXPLAINER_JSON_SCHEMA = {
  type: "object",
  properties: {
    overview: { type: "string" },
    perType: {
      type: "array",
      items: {
        type: "object",
        properties: {
          piiType: { type: "string" },
          risk: { type: "string" },
          advice: { type: "string" },
        },
        required: ["piiType", "risk", "advice"],
      },
    },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["overview", "perType", "limitations"],
};
