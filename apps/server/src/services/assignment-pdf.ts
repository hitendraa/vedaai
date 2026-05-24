import PDFDocument from "pdfkit";

type AssignmentPdfInput = {
  assignment: {
    title: string;
    dueDate: Date;
  };
  result: {
    sections: Array<{
      title: string;
      instruction: string;
      questions: Array<{
        text: string;
        difficulty: "easy" | "medium" | "hard";
        marks: number;
      }>;
    }>;
    totalMarks: number;
  };
};

const pageMargin = 54;

function getDifficultyLabel(difficulty: "easy" | "medium" | "hard") {
  return {
    easy: "Easy",
    medium: "Moderate",
    hard: "Hard",
  }[difficulty];
}

function getDifficultyColor(difficulty: "easy" | "medium" | "hard") {
  return {
    easy: "#16833a",
    medium: "#8a5f00",
    hard: "#d91f11",
  }[difficulty];
}

function writeMetaLine(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#111111")
    .text(label, { continued: true })
    .font("Helvetica")
    .fillColor("#333333")
    .text(` ${value}`);
}

function writeStudentLine(doc: PDFKit.PDFDocument, label: string) {
  const startX = doc.x;
  const baselineY = doc.y + 10;

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text(label, {
    continued: true,
  });
  doc
    .moveTo(startX + 78, baselineY)
    .lineTo(startX + 170, baselineY)
    .strokeColor("#111111")
    .lineWidth(0.6)
    .stroke();
  doc.text(" ");
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - pageMargin) {
    doc.addPage();
  }
}

function writeQuestion(
  doc: PDFKit.PDFDocument,
  index: number,
  question: AssignmentPdfInput["result"]["sections"][number]["questions"][number],
) {
  const contentWidth =
    doc.page.width - pageMargin * 2 - 48;
  const estimatedHeight = doc.heightOfString(question.text, {
    width: contentWidth,
    lineGap: 2,
  }) + 26;

  ensureSpace(doc, estimatedHeight);

  const questionTop = doc.y;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(`${index}.`, pageMargin, questionTop, {
      width: 20,
      continued: false,
    });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#222222")
    .text(question.text, pageMargin + 24, questionTop, {
      width: contentWidth,
      lineGap: 2,
    });

  const marksY = questionTop;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#111111")
    .text(`[${question.marks} Mark${question.marks === 1 ? "" : "s"}]`, {
      align: "right",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(getDifficultyColor(question.difficulty))
    .text(getDifficultyLabel(question.difficulty), pageMargin + 24, marksY + estimatedHeight - 14);

  doc.moveDown(1);
}

export async function renderAssignmentPdf(input: AssignmentPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: pageMargin,
      bufferPages: true,
      info: {
        Title: input.assignment.title,
        Author: "VedaAI",
        Subject: "AI Generated Assessment",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const contentWidth = doc.page.width - pageMargin * 2;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111111")
      .text("Delhi Public School, Sector-4, Bokaro", {
        align: "center",
      });

    doc.moveDown(0.4);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(input.assignment.title || "Question Paper", {
        align: "center",
      });
    doc.font("Helvetica").fontSize(9).text("Class: 5th", {
      align: "center",
    });

    doc.moveDown(1.2);
    const infoY = doc.y;
    doc.x = pageMargin;
    writeMetaLine(doc, "Time Allowed:", "45 minutes");
    doc.y = infoY;
    doc.x = pageMargin;
    doc.font("Helvetica-Bold").fontSize(9).text(
      `Maximum Marks: ${input.result.totalMarks}`,
      {
        align: "right",
        width: contentWidth,
      },
    );

    doc.moveDown(1.2);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#222222")
      .text("All questions are compulsory unless stated otherwise.", {
        width: contentWidth,
      });

    doc.moveDown(1.1);
    const studentY = doc.y;
    doc.x = pageMargin;
    doc.y = studentY;
    writeStudentLine(doc, "Name:");
    doc.x = pageMargin + 190;
    doc.y = studentY;
    writeStudentLine(doc, "Roll Number:");
    doc.x = pageMargin + 400;
    doc.y = studentY;
    writeStudentLine(doc, "Section:");

    doc.moveDown(1.3);
    doc
      .moveTo(pageMargin, doc.y)
      .lineTo(doc.page.width - pageMargin, doc.y)
      .strokeColor("#dedede")
      .lineWidth(0.8)
      .stroke();
    doc.moveDown(1.2);

    input.result.sections.forEach((section) => {
      ensureSpace(doc, 92);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#111111")
        .text(section.title, {
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#111111")
        .text(section.instruction, {
          align: "center",
        });

      doc.moveDown(1.1);
      section.questions.forEach((question, index) => {
        writeQuestion(doc, index + 1, question);
      });
      doc.moveDown(0.6);
    });

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#777777")
        .text(
          `Generated by VedaAI | Due: ${input.assignment.dueDate.toLocaleDateString("en-IN")}`,
          pageMargin,
          doc.page.height - 36,
          {
            width: contentWidth,
            align: "center",
          },
        );
    }

    doc.end();
  });
}
