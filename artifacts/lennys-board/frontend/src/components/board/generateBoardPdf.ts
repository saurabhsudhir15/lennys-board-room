import jsPDF from "jspdf";
import type { BoardResponse, PickYourMove } from "./types";

const BG: [number, number, number] = [22, 20, 15];
const EMBER: [number, number, number] = [255, 107, 53];
const TEXT: [number, number, number] = [245, 245, 240];
const MUTED: [number, number, number] = [138, 138, 122];
const CARD: [number, number, number] = [36, 30, 22];
const CHOSEN_BG: [number, number, number] = [55, 28, 8];
const AMBER: [number, number, number] = [245, 158, 11];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const CW = PAGE_W - M * 2;
const BOTTOM_SAFE = 272;

function fillPage(doc: jsPDF) {
  doc.setFillColor(...BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function addPage(doc: jsPDF): number {
  doc.addPage();
  fillPage(doc);
  return M + 10;
}

function checkSpace(doc: jsPDF, y: number, needed: number): number {
  return y + needed > BOTTOM_SAFE ? addPage(doc) : y;
}

function resetText(doc: jsPDF) {
  doc.setCharSpace(0);
}

function sectionLabel(doc: jsPDF, text: string, y: number): number {
  resetText(doc);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EMBER);
  doc.setCharSpace(1.8);
  doc.text(text.toUpperCase(), M, y);
  resetText(doc);
  return y + 7;
}

function rule(doc: jsPDF, y: number): number {
  doc.setDrawColor(255, 107, 53);
  doc.setLineWidth(0.2);
  doc.saveGraphicsState();
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.18 }));
  doc.line(M, y, PAGE_W - M, y);
  doc.restoreGraphicsState();
  return y + 8;
}

function bodyText(
  doc: jsPDF,
  text: string,
  y: number,
  {
    color = TEXT,
    size = 10.5,
    style = "normal",
    maxW = CW,
    lineH = 5.6,
  }: {
    color?: [number, number, number];
    size?: number;
    style?: string;
    maxW?: number;
    lineH?: number;
  } = {}
): number {
  resetText(doc);
  doc.setFontSize(size);
  doc.setFont("helvetica", style);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, M, y);
  return y + lines.length * lineH + 1.5;
}

export function generateBoardPdf(
  problem: string,
  data: BoardResponse,
  chosenMove: PickYourMove | null
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  fillPage(doc);

  let y = M + 2;

  resetText(doc);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EMBER);
  doc.text("Board Brief", M, y);
  y += 5;

  resetText(doc);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("Powered by Lenny's Podcast", M, y + 4);
  y += 14;

  y = rule(doc, y);

  y = sectionLabel(doc, "The Problem", y);

  resetText(doc);
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...TEXT);
  const problemLines = doc.splitTextToSize(problem, CW);
  doc.text(problemLines, M, y);
  y += problemLines.length * 6.2 + 8;

  y = rule(doc, y);
  y = sectionLabel(doc, "Your Board", y);

  for (const member of data.board) {
    resetText(doc);
    const roleW = 28;
    const responseLines = doc.splitTextToSize(member.response, CW - 8);
    const titleLines = doc.splitTextToSize(member.guest_title ?? "", CW - roleW - 12);
    const cardH = 16 + titleLines.length * 4.5 + responseLines.length * 5.2 + 6;

    y = checkSpace(doc, y, cardH + 5);

    doc.setFillColor(...CARD);
    doc.roundedRect(M, y - 2, CW, cardH, 3, 3, "F");

    resetText(doc);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...EMBER);
    doc.setCharSpace(1.2);
    doc.text(member.role.toUpperCase(), M + 5, y + 5.5);
    resetText(doc);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    const roleTextW = (doc.getStringUnitWidth(member.role.toUpperCase()) * 7 * 1.2) / doc.internal.scaleFactor;
    doc.text(member.guest_name, M + 5 + roleTextW + 5, y + 5.5);

    resetText(doc);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(titleLines, M + 5, y + 11.5);

    resetText(doc);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT);
    const responseY = y + 11.5 + titleLines.length * 4.5 + 3;
    doc.text(responseLines, M + 5, responseY);

    y += cardH + 6;
  }

  y = checkSpace(doc, y, 35);
  y = rule(doc, y);
  y = sectionLabel(doc, "The Debate", y);

  resetText(doc);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...TEXT);
  const debateLines = doc.splitTextToSize(data.debate, CW);
  doc.text(debateLines, M, y);
  y += debateLines.length * 5.6 + 8;

  if (data.lenny_insight) {
    y = checkSpace(doc, y, 30);
    y = sectionLabel(doc, "Lenny's Take", y);

    doc.setFillColor(32, 27, 22);
    const insightLines = doc.splitTextToSize(data.lenny_insight, CW - 12);
    const insightH = insightLines.length * 5.4 + 10;
    doc.roundedRect(M, y - 3, CW, insightH, 3, 3, "F");

    doc.setDrawColor(...EMBER);
    doc.setLineWidth(0.6);
    doc.line(M, y - 3, M, y - 3 + insightH);

    resetText(doc);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...TEXT);
    doc.text(insightLines, M + 6, y + 2);
    y += insightH + 8;
  }

  y = checkSpace(doc, y, 55);
  y = rule(doc, y);
  y = sectionLabel(doc, "Synthesis", y);

  const synth = data.synthesis;

  y = sectionLabel(doc, "What the board agrees", y);
  resetText(doc);
  y = bodyText(doc, synth.agrees, y, { size: 10.5 });
  y += 4;

  y = checkSpace(doc, y, 25);
  y = sectionLabel(doc, "The open question", y);
  resetText(doc);
  y = bodyText(doc, synth.tension, y, { size: 10.5 });
  y += 4;

  y = checkSpace(doc, y, 25);
  y = sectionLabel(doc, "Your next move", y);
  resetText(doc);
  y = bodyText(doc, synth.next_move, y, { size: 10.5 });

  if (data.pick_your_move && data.pick_your_move.length > 0) {
    y = addPage(doc);

    y = sectionLabel(doc, "Pick Your Move — Three Paths Forward", y);
    y += 2;

    for (let i = 0; i < data.pick_your_move.length; i++) {
      const move = data.pick_your_move[i];
      const isChosen = chosenMove?.title === move.title;

      resetText(doc);
      const titleLines = doc.splitTextToSize(move.title, CW - 8);
      const actionLines = doc.splitTextToSize(move.action, CW - 8);
      const reasonLabel = "Why this works:";
      const reasonLines = doc.splitTextToSize(
        `${reasonLabel} ${move.reasoning}`,
        CW - 8
      );
      const tradeLines = move.tradeoff
        ? doc.splitTextToSize(`What you're giving up: ${move.tradeoff}`, CW - 8)
        : [];

      const labelH = isChosen ? 8 : 0;
      const cardH =
        labelH +
        titleLines.length * 6.2 +
        actionLines.length * 5.4 +
        reasonLines.length * 5.4 +
        tradeLines.length * 5.4 +
        24;

      y = checkSpace(doc, y, cardH + 6);

      if (isChosen) {
        doc.setFillColor(...CHOSEN_BG);
        doc.setDrawColor(...EMBER);
        doc.setLineWidth(0.5);
        doc.roundedRect(M, y - 3, CW, cardH, 3, 3, "FD");
      } else {
        doc.setFillColor(...CARD);
        doc.roundedRect(M, y - 3, CW, cardH, 3, 3, "F");
      }

      let cy = y + 4;

      if (isChosen) {
        resetText(doc);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...EMBER);
        doc.setCharSpace(1.2);
        const chosenLabel = ">> CHOSEN PATH";
        doc.text(chosenLabel, PAGE_W - M - doc.getTextWidth(chosenLabel) - 4, cy);
        resetText(doc);
        cy += 6;
      }

      resetText(doc);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isChosen ? EMBER[0] : TEXT[0], isChosen ? EMBER[1] : TEXT[1], isChosen ? EMBER[2] : TEXT[2]);
      doc.text(titleLines, M + 5, cy);
      cy += titleLines.length * 6.2 + 3;

      resetText(doc);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT);
      doc.text(actionLines, M + 5, cy);
      cy += actionLines.length * 5.4 + 4;

      resetText(doc);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...MUTED);
      doc.text(reasonLines, M + 5, cy);
      cy += reasonLines.length * 5.4 + 3;

      if (tradeLines.length > 0) {
        resetText(doc);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...AMBER);
        doc.text(tradeLines, M + 5, cy);
        cy += tradeLines.length * 5.4 + 3;
      }

      resetText(doc);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...EMBER);
      doc.text(`Backed by ${move.backed_by}`, M + 5, y + cardH - 7);

      y += cardH + 7;
    }
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    resetText(doc);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Lenny's Board of Directors", M, PAGE_H - 8);
    doc.text(`${p} / ${pageCount}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }

  doc.save("board-brief.pdf");
}
