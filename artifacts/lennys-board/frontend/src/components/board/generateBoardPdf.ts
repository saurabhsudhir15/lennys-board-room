import jsPDF from "jspdf";
import type { BoardResponse, PickYourMove } from "./types";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  bg:       [22,  20,  15]  as [number, number, number],
  surface:  [34,  28,  20]  as [number, number, number],
  ember:    [255, 107, 53]  as [number, number, number],
  amber:    [245, 158, 11]  as [number, number, number],
  text:     [245, 245, 240] as [number, number, number],
  muted:    [138, 138, 122] as [number, number, number],
  chosen:   [52,  26,  8]   as [number, number, number],
};

/* ─── Page geometry ────────────────────────────────────────────────────────── */
const PW   = 210;   // page width  (mm)
const PH   = 297;   // page height (mm)
const ML   = 18;    // left margin
const MR   = 18;    // right margin
const CW   = PW - ML - MR;   // content width
const SAFE = 276;   // y-safe zone before new page

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function bgFill(doc: jsPDF) {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PW, PH, "F");
}

function newPage(doc: jsPDF): number {
  doc.addPage();
  bgFill(doc);
  return ML + 10;
}

function guard(doc: jsPDF, y: number, need: number): number {
  return y + need > SAFE ? newPage(doc) : y;
}

/** Thin ember rule */
function rule(doc: jsPDF, y: number): number {
  doc.setDrawColor(...C.ember);
  doc.setLineWidth(0.15);
  doc.saveGraphicsState();
  (doc as any).setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.line(ML, y, PW - MR, y);
  doc.restoreGraphicsState();
  return y + 6;
}

/** Section heading — no charSpace, no global side-effects */
function heading(doc: jsPDF, label: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.ember);
  doc.text(label.toUpperCase(), ML, y);
  return y + 6;
}

/** Body paragraph — wraps and returns new y */
function para(
  doc: jsPDF,
  text: string,
  y: number,
  opts: { size?: number; style?: string; color?: [number,number,number]; maxW?: number; lh?: number } = {}
): number {
  const { size = 10, style = "normal", color = C.text, maxW = CW, lh = 5.4 } = opts;
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, ML, y);
  return y + lines.length * lh + 1;
}

/* ─── Main export ──────────────────────────────────────────────────────────── */

export function generateBoardPdf(
  problem: string,
  data: BoardResponse,
  chosenMove: PickYourMove | null,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  bgFill(doc);

  let y = ML;

  /* ── Cover header ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.ember);
  doc.text("Board Brief", ML, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("Powered by Lenny's Podcast", ML, y + 18);
  y += 28;

  y = rule(doc, y);

  /* ── Problem ── */
  y = heading(doc, "The Problem", y);
  y = para(doc, problem, y, { size: 11, style: "italic", lh: 5.8 });
  y += 6;

  y = rule(doc, y);

  /* ── Board members ── */
  y = heading(doc, "Your Board", y);

  for (const member of data.board) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    const responseLines = doc.splitTextToSize(member.response, CW - 8);
    const cardH = 18 + responseLines.length * 5.2 + 6;

    y = guard(doc, y, cardH + 5);

    /* card background */
    doc.setFillColor(...C.surface);
    doc.roundedRect(ML, y - 2, CW, cardH, 2.5, 2.5, "F");

    /* role (small, ember) */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.ember);
    doc.text(member.role.toUpperCase(), ML + 5, y + 5.5);

    /* name (medium, white) — on same line, offset after role */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.text);
    const roleW = doc.getTextWidth(member.role.toUpperCase());
    doc.text(member.guest_name, ML + 5 + roleW + 4, y + 5.5);

    /* episode / source */
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(member.episode_title || "Lenny's Podcast", ML + 5, y + 11.5);

    /* response text */
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.text);
    doc.text(responseLines, ML + 5, y + 17);

    y += cardH + 6;
  }

  /* ── Debate ── */
  y = guard(doc, y, 35);
  y = rule(doc, y);
  y = heading(doc, "The Debate", y);
  y = para(doc, data.debate, y, { size: 10, style: "italic", lh: 5.6 });
  y += 4;

  /* ── Lenny's Take ── */
  if (data.lenny_insight) {
    y = guard(doc, y, 30);
    y = heading(doc, "Lenny's Take", y);

    const insightLines = doc.splitTextToSize(data.lenny_insight, CW - 10);
    const boxH = insightLines.length * 5.2 + 10;

    doc.setFillColor(...C.surface);
    doc.roundedRect(ML, y - 2, CW, boxH, 2.5, 2.5, "F");
    doc.setDrawColor(...C.ember);
    doc.setLineWidth(0.5);
    doc.line(ML, y - 2, ML, y - 2 + boxH);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.text);
    doc.text(insightLines, ML + 6, y + 4);

    y += boxH + 8;
  }

  /* ── Synthesis ── */
  y = guard(doc, y, 50);
  y = rule(doc, y);
  y = heading(doc, "Synthesis", y);

  y = heading(doc, "What the board agrees", y);
  y = para(doc, data.synthesis.agrees, y, { size: 10 });
  y += 3;

  y = guard(doc, y, 25);
  y = heading(doc, "The open question", y);
  y = para(doc, data.synthesis.tension, y, { size: 10 });
  y += 3;

  y = guard(doc, y, 25);
  y = heading(doc, "Your next move", y);
  y = para(doc, data.synthesis.next_move, y, { size: 10 });

  /* ── Pick Your Move ── */
  if (data.pick_your_move && data.pick_your_move.length > 0) {
    y = newPage(doc);
    y = heading(doc, "Pick Your Move — Three Paths Forward", y);
    y += 2;

    for (const move of data.pick_your_move) {
      const isChosen = chosenMove?.title === move.title;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const titleLines  = doc.splitTextToSize(move.title, CW - 8);
      const actionLines = doc.splitTextToSize(move.action, CW - 8);
      const reasonText  = `Why this works: ${move.reasoning}`;
      const reasonLines = doc.splitTextToSize(reasonText, CW - 8);
      const tradeLines  = move.tradeoff
        ? doc.splitTextToSize(`Tradeoff: ${move.tradeoff}`, CW - 8)
        : [];

      const cardH =
        titleLines.length  * 6.2 +
        actionLines.length * 5.4 +
        reasonLines.length * 5.2 +
        tradeLines.length  * 5.2 +
        (tradeLines.length ? 3 : 0) +
        20;

      y = guard(doc, y, cardH + 6);

      /* card fill */
      doc.setFillColor(...(isChosen ? C.chosen : C.surface));
      if (isChosen) {
        doc.setDrawColor(...C.ember);
        doc.setLineWidth(0.4);
        doc.roundedRect(ML, y - 2, CW, cardH, 2.5, 2.5, "FD");
      } else {
        doc.roundedRect(ML, y - 2, CW, cardH, 2.5, 2.5, "F");
      }

      let cy = y + 5;

      /* title */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...(isChosen ? C.ember : C.text));
      doc.text(titleLines, ML + 5, cy);
      cy += titleLines.length * 6.2 + 2;

      /* chosen indicator — plain text, no badge */
      if (isChosen) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...C.ember);
        doc.text("Recommended path", ML + 5, cy);
        cy += 5;
      }

      /* action */
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...C.text);
      doc.text(actionLines, ML + 5, cy);
      cy += actionLines.length * 5.4 + 3;

      /* reasoning */
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...C.muted);
      doc.text(reasonLines, ML + 5, cy);
      cy += reasonLines.length * 5.2 + (tradeLines.length ? 3 : 0);

      /* tradeoff */
      if (tradeLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...C.amber);
        doc.text(tradeLines, ML + 5, cy);
      }

      y += cardH + 7;
    }
  }

  /* ── Footer on every page ── */
  const total = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text("Lenny's Board of Directors", ML, PH - 8);
    doc.text(`${p} / ${total}`, PW - MR, PH - 8, { align: "right" });
  }

  doc.save("board-brief.pdf");
}
