import jsPDF from "jspdf";
import type { BoardResponse, PickYourMove } from "./types";

const BG: [number, number, number] = [22, 20, 15];
const EMBER: [number, number, number] = [255, 107, 53];
const TEXT: [number, number, number] = [245, 245, 240];
const MUTED: [number, number, number] = [138, 138, 122];
const CARD: [number, number, number] = [32, 27, 20];
const CHOSEN: [number, number, number] = [60, 30, 10];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const CW = PAGE_W - M * 2;
const LINE_H = 5.5;
const BOTTOM_SAFE = 270;

function newPage(doc: jsPDF) {
  doc.addPage();
  doc.setFillColor(...BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  return M + 12;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_SAFE) return newPage(doc);
  return y;
}

function label(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(7.5);
  doc.setTextColor(...EMBER);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), M, y, { charSpace: 1.2 });
  return y + 6;
}

function divider(doc: jsPDF, y: number): number {
  doc.setDrawColor(...EMBER);
  doc.setLineWidth(0.15);
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.line(M, y, PAGE_W - M, y);
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  return y + 7;
}

function bodyText(
  doc: jsPDF,
  text: string,
  y: number,
  opts: { color?: [number, number, number]; size?: number; style?: string; maxW?: number } = {}
): number {
  const { color = TEXT, size = 10.5, style = "normal", maxW = CW } = opts;
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.setFont("helvetica", style);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, M, y);
  return y + lines.length * LINE_H + 1;
}

export function generateBoardPdf(
  problem: string,
  data: BoardResponse,
  chosenMove: PickYourMove | null
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(...BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  let y = M + 4;

  doc.setFontSize(22);
  doc.setTextColor(...EMBER);
  doc.setFont("helvetica", "bold");
  doc.text("Board Brief", M, y);
  y += 3;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by Lenny's Podcast", M, y + 5);
  y += 12;

  y = divider(doc, y);

  y = label(doc, "The Problem", y);
  y = bodyText(doc, problem, y, { size: 12, style: "italic" });
  y += 6;

  y = divider(doc, y);

  y = label(doc, "Your Board", y);

  for (const member of data.board) {
    const responseLines = doc.splitTextToSize(member.response, CW - 6);
    const cardH = 8 + responseLines.length * LINE_H + 4;
    y = ensureSpace(doc, y, cardH + 4);

    doc.setFillColor(...CARD);
    doc.roundedRect(M, y - 3, CW, cardH, 3, 3, "F");

    doc.setFontSize(7.5);
    doc.setTextColor(...EMBER);
    doc.setFont("helvetica", "bold");
    doc.text(member.role.toUpperCase(), M + 4, y + 3.5, { charSpace: 0.8 });

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(member.guest_name, M + 4 + doc.getTextWidth(member.role.toUpperCase()) + 6, y + 3.5);

    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(member.guest_title, M + 4, y + 8.5);

    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT);
    doc.text(responseLines, M + 4, y + 14);

    y += cardH + 5;
  }

  y = ensureSpace(doc, y, 30);
  y = divider(doc, y);
  y = label(doc, "The Debate", y);
  y = bodyText(doc, data.debate, y, { color: TEXT, size: 10 });
  y += 5;

  if (data.lenny_insight) {
    y = ensureSpace(doc, y, 25);
    doc.setDrawColor(...EMBER);
    doc.setLineWidth(0.5);
    doc.line(M, y, M, y + 20);
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "italic");
    const insightLines = doc.splitTextToSize(data.lenny_insight, CW - 8);
    doc.text(insightLines, M + 5, y + 4);
    doc.setFontSize(7.5);
    doc.setTextColor(...EMBER);
    doc.setFont("helvetica", "bold");
    doc.text("LENNY'S TAKE", M + 5, y + 4 + insightLines.length * LINE_H + 3, { charSpace: 0.8 });
    y += insightLines.length * LINE_H + 14;
  }

  y = ensureSpace(doc, y, 40);
  y = divider(doc, y);
  y = label(doc, "Synthesis", y);

  const synth = data.synthesis;
  y = label(doc, "What the board agrees", y);
  y = bodyText(doc, synth.agrees, y, { size: 10 });
  y += 3;

  y = ensureSpace(doc, y, 20);
  y = label(doc, "The open question", y);
  y = bodyText(doc, synth.tension, y, { size: 10 });
  y += 3;

  y = ensureSpace(doc, y, 20);
  y = label(doc, "Your next move", y);
  y = bodyText(doc, synth.next_move, y, { size: 10 });

  if (data.pick_your_move && data.pick_your_move.length > 0) {
    y = newPage(doc);

    y = label(doc, "Pick Your Move — Three Paths Forward", y);
    y += 2;

    for (let i = 0; i < data.pick_your_move.length; i++) {
      const move = data.pick_your_move[i];
      const isChosen = chosenMove?.title === move.title;

      const moveLines = doc.splitTextToSize(move.action, CW - 8);
      const reasonLines = doc.splitTextToSize(`Why this works: ${move.reasoning}`, CW - 8);
      const tradeLines = move.tradeoff
        ? doc.splitTextToSize(`What you're giving up: ${move.tradeoff}`, CW - 8)
        : [];
      const cardH = 10 + moveLines.length * LINE_H + reasonLines.length * LINE_H + tradeLines.length * LINE_H + 12;

      y = ensureSpace(doc, y, cardH + 6);

      if (isChosen) {
        doc.setFillColor(...CHOSEN);
        doc.setDrawColor(...EMBER);
        doc.setLineWidth(0.5);
        doc.roundedRect(M, y - 3, CW, cardH, 3, 3, "FD");
        doc.setFontSize(7);
        doc.setTextColor(...EMBER);
        doc.setFont("helvetica", "bold");
        doc.text("✓  CHOSEN PATH", PAGE_W - M - doc.getTextWidth("✓  CHOSEN PATH") - 2, y + 3);
      } else {
        doc.setFillColor(...CARD);
        doc.roundedRect(M, y - 3, CW, cardH, 3, 3, "F");
      }

      doc.setFontSize(11);
      doc.setTextColor(isChosen ? EMBER[0] : TEXT[0], isChosen ? EMBER[1] : TEXT[1], isChosen ? EMBER[2] : TEXT[2]);
      doc.setFont("helvetica", "bold");
      doc.text(move.title, M + 5, y + 4);

      let cy = y + 10;
      doc.setFontSize(9.5);
      doc.setTextColor(...TEXT);
      doc.setFont("helvetica", "normal");
      doc.text(moveLines, M + 5, cy);
      cy += moveLines.length * LINE_H + 3;

      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "italic");
      doc.text(reasonLines, M + 5, cy);
      cy += reasonLines.length * LINE_H + 2;

      if (tradeLines.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(245, 158, 11);
        doc.text(tradeLines, M + 5, cy);
      }

      doc.setFontSize(8);
      doc.setTextColor(...EMBER);
      doc.setFont("helvetica", "normal");
      doc.text(`Backed by ${move.backed_by}`, M + 5, y + cardH - 5);

      y += cardH + 6;
    }
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("Lenny's Board of Directors", M, PAGE_H - 8);
    doc.text(`${p} / ${pageCount}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }

  doc.save("board-brief.pdf");
}
