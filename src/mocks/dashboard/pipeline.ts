import type { PipelineStage } from "./types";

export const quotePipeline: PipelineStage[] = [
  {
    labelKey: "status.draft",
    value: "18 600 €",
    count: 3,
    color: "#d8dfeb",
  },
  {
    labelKey: "status.sent",
    value: "64 250 €",
    count: 5,
    color: "#4f86f3",
  },
  {
    labelKey: "status.review",
    value: "42 800 €",
    count: 2,
    color: "#f1b86b",
  },
  {
    labelKey: "status.accepted",
    value: "86 450 €",
    count: 6,
    color: "#4eb489",
  },
  {
    labelKey: "status.rejected",
    value: "21 300 €",
    count: 3,
    color: "#e7a8a2",
  },
  {
    labelKey: "status.expired",
    value: "15 900 €",
    count: 2,
    color: "#c5ceda",
  },
];

export const pipelineSummary = {
  openValue: "125 650 €",
  closeRate: "68,4%",
};
