import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import JSZip from "jszip";
import type {
  CareerTarget,
  StructuredResume,
  StructuredResumeItem,
  StructuredResumeSection,
} from "@/lib/ai/types";

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";

const targetRoleLabels: Record<CareerTarget, string> = {
  software_engineering: "Software Engineering Student",
  quant: "Quantitative Research Student",
  finance: "Finance Student",
  general: "Student Profile",
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isBasicSectionHeading(line: string) {
  return (
    line.length > 0 &&
    line.length <= 48 &&
    !line.startsWith("-") &&
    !line.startsWith("*") &&
    /^[A-Z][A-Z0-9 /&()'-]+$/.test(line)
  );
}

export async function renderBasicResumeDocx(resumeText: string) {
  const zip = new JSZip();
  const paragraphs = resumeText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) return "<w:p/>";

      if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
        return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(trimmed.replace(/^[-*•]\s*/, ""))}</w:t></w:r></w:p>`;
      }

      if (isBasicSectionHeading(trimmed)) {
        return `<w:p><w:pPr><w:pStyle w:val="ResumeHeading"/><w:spacing w:before="220" w:after="100"/></w:pPr><w:r><w:t>${escapeXml(trimmed)}</w:t></w:r></w:p>`;
      }

      return `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`;
    })
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${WORD_NS}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ResumeHeading"><w:name w:val="Resume Heading"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`,
  );
  zip.file(
    "word/numbering.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="${WORD_NS}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${WORD_NS}"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  );

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) delete zip.files[path];
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function sectionKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findSection(
  resume: StructuredResume,
  patterns: RegExp[],
): StructuredResumeSection | undefined {
  return resume.sections.find((section) =>
    patterns.some((pattern) => pattern.test(sectionKey(section.title))),
  );
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function sectionLines(section?: StructuredResumeSection) {
  if (!section) return [];

  return uniqueStrings(
    section.items.flatMap((item) => [
      item.name,
      item.role,
      item.organization,
      item.meta,
      ...item.details,
      ...item.bullets,
    ]),
  );
}

function labeledValue(lines: string[], pattern: RegExp) {
  const line = lines.find((candidate) => pattern.test(candidate));
  return line?.replace(/^[^:]+:\s*/, "").trim() ?? "";
}

function joinItemMeta(item?: StructuredResumeItem) {
  if (!item) return "";
  return uniqueStrings([item.meta, item.location, item.date]).join(" | ");
}

function replaceParagraphText(paragraph: Element, value: string) {
  const textNodes = paragraph.getElementsByTagNameNS(WORD_NS, "t");

  if (textNodes.length === 0) return;

  textNodes[0].textContent = value;
  textNodes[0].setAttributeNS(XML_NS, "xml:space", "preserve");

  for (let index = 1; index < textNodes.length; index += 1) {
    textNodes[index].textContent = "";
  }
}

function paragraphText(paragraph: Element) {
  const textNodes = paragraph.getElementsByTagNameNS(WORD_NS, "t");
  let text = "";

  for (let index = 0; index < textNodes.length; index += 1) {
    text += textNodes[index].textContent ?? "";
  }

  return text.trim();
}

function profileSummary(section?: StructuredResumeSection) {
  if (!section) return "";

  const lines = sectionLines(section).filter(
    (line) => !/^(profile|summary)$/i.test(line),
  );
  return lines.join(" ");
}

function buildTemplateValues(
  resume: StructuredResume,
  targetTrack: CareerTarget,
) {
  const skills = findSection(resume, [/skill/]);
  const languages = findSection(resume, [/language/]);
  const interests = findSection(resume, [/interest/, /additional information/]);
  const profile = findSection(resume, [/profile/, /summary/, /objective/]);
  const education = findSection(resume, [/education/]);
  const projects = findSection(resume, [/project/, /research/]);
  const experience = findSection(resume, [
    /experience/,
    /leadership/,
    /employment/,
    /activities/,
  ]);

  const skillLines = sectionLines(skills);
  const languageLines = sectionLines(languages);
  const interestLines = sectionLines(interests);
  const educationItem = education?.items[0];
  const educationDetails = educationItem?.details ?? [];
  const educationLines = sectionLines(education);
  const degree =
    educationItem?.role ||
    (educationItem?.organization ? educationItem.name : "") ||
    educationDetails.find(
      (line) => !/course|module|award|grade|rank|scholar|prize|honou?r/i.test(line),
    ) ||
    "";
  const coursework =
    labeledValue(educationLines, /course|module/i) ||
    educationLines.find((line) => /course|module/i.test(line)) ||
    "";
  const academicHighlight =
    educationLines.find((line) =>
      /academic highlight|award|grade|rank|scholar|honou?r|prize/i.test(line),
    ) ||
    "";

  return {
    fullName: resume.header.name,
    targetRole: targetRoleLabels[targetTrack],
    location: resume.header.location,
    email: resume.header.email,
    phone: resume.header.phone,
    links: resume.header.links.join(" / "),
    programmingLanguages: labeledValue(skillLines, /languages?|programming/i),
    frameworks: labeledValue(skillLines, /framework|librar/i),
    tools: labeledValue(skillLines, /tools?|cloud|database|technolog/i),
    otherSkills: skillLines.find(
      (line) => !/languages?|programming|framework|librar|tools?|cloud|database|technolog/i.test(line),
    ) ?? "",
    languages: languageLines,
    interests: interestLines,
    profile: profileSummary(profile),
    educationItem,
    educationDegree: degree,
    educationMeta: uniqueStrings([
      educationItem?.location,
      educationItem?.date,
    ]).join(" | "),
    coursework: coursework.replace(/^(relevant\s+)?(coursework|courses|modules):?\s*/i, ""),
    academicHighlight: academicHighlight.replace(/^academic highlight:\s*/i, ""),
    projects: projects?.items ?? [],
    experience: experience?.items ?? [],
  };
}

export async function renderResumeIntoUploadedTemplate(options: {
  templateFile: File;
  structuredResume: StructuredResume;
  targetTrack: CareerTarget;
}) {
  const zip = await JSZip.loadAsync(await options.templateFile.arrayBuffer());
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("TEMPLATE_RENDER_FAILED: Invalid DOCX template.");
  }

  const documentXml = await documentFile.async("string");
  const xmlDocument = new DOMParser().parseFromString(
    documentXml,
    "application/xml",
  );
  const paragraphs = xmlDocument.getElementsByTagNameNS(WORD_NS, "p");
  const values = buildTemplateValues(
    options.structuredResume,
    options.targetTrack,
  );

  let currentSection = "";
  let languageIndex = 0;
  let interestIndex = 0;
  let projectIndex = -1;
  let projectBulletIndex = 0;
  let experienceIndex = -1;
  let experienceBulletIndex = 0;

  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index];
    const text = paragraphText(paragraph);
    const normalized = text.toLowerCase();

    if (
      text &&
      !text.includes("[") &&
      /^[A-Z][A-Z &/]+$/.test(text)
    ) {
      currentSection = sectionKey(text);
      continue;
    }

    let replacement: string | undefined;

    if (/^\[full name\]$/i.test(text)) replacement = values.fullName;
    else if (/^\[target role/i.test(text)) replacement = values.targetRole;
    else if (/^\[city,? country\]$/i.test(text)) replacement = values.location;
    else if (/^\[email/i.test(text)) replacement = values.email;
    else if (/^\[\+?\d|phone/i.test(text)) replacement = values.phone;
    else if (/linkedin|github|portfolio/i.test(text) && text.includes("[")) {
      replacement = values.links;
    } else if (/programming languages?/i.test(text)) {
      replacement = values.programmingLanguages;
    } else if (/frameworks? and librar/i.test(text)) {
      replacement = values.frameworks;
    } else if (/tools?, cloud, databases?/i.test(text)) {
      replacement = values.tools;
    } else if (/other relevant capabilities/i.test(text)) {
      replacement = values.otherSkills;
    } else if (/language - proficiency/i.test(text)) {
      replacement = values.languages[languageIndex++] ?? "";
    } else if (/specific interest/i.test(text)) {
      replacement = values.interests[interestIndex++] ?? "";
    } else if (/two-line summary/i.test(text)) {
      replacement = values.profile;
    } else if (/^\[university name\]$/i.test(text)) {
      replacement =
        values.educationItem?.organization || values.educationItem?.name || "";
    } else if (/degree and subject/i.test(text)) {
      replacement = uniqueStrings([
        values.educationDegree,
        values.educationMeta,
      ]).join(" | ");
    } else if (/relevant coursework/i.test(text)) {
      replacement = values.coursework
        ? `• Relevant coursework: ${values.coursework}`
        : "";
    } else if (/academic highlight/i.test(text)) {
      replacement = values.academicHighlight
        ? `• Academic highlight: ${values.academicHighlight}`
        : "";
    } else if (
      currentSection.includes("project") &&
      (/^\[project name\]$/i.test(text) || /^\[second project\]$/i.test(text))
    ) {
      projectIndex += 1;
      projectBulletIndex = 0;
      replacement = values.projects[projectIndex]?.name ?? "";
    } else if (
      currentSection.includes("project") &&
      /technology stack/i.test(text)
    ) {
      const project = values.projects[projectIndex];
      replacement = uniqueStrings([
        project?.meta,
        project?.role,
        project?.date,
      ]).join(" | ");
    } else if (currentSection.includes("project") && text.startsWith("•")) {
      const bullet = values.projects[projectIndex]?.bullets[projectBulletIndex++];
      replacement = bullet ? `• ${bullet}` : "";
    } else if (
      currentSection.includes("experience") &&
      /^\[organisation\]$/i.test(text)
    ) {
      experienceIndex += 1;
      experienceBulletIndex = 0;
      const item = values.experience[experienceIndex];
      replacement = item?.organization || item?.name || "";
    } else if (
      currentSection.includes("experience") &&
      /role title/i.test(text)
    ) {
      const item = values.experience[experienceIndex];
      replacement = uniqueStrings([
        item?.role ||
          (item?.organization && item.name !== item.organization
            ? item.name
            : ""),
        item?.location,
        item?.date,
      ]).join(" | ");
    } else if (currentSection.includes("experience") && text.startsWith("•")) {
      const bullet =
        values.experience[experienceIndex]?.bullets[experienceBulletIndex++];
      replacement = bullet ? `• ${bullet}` : "";
    } else if (text.includes("[") && text.includes("]")) {
      replacement = "";
    }

    if (replacement !== undefined) {
      replaceParagraphText(paragraph, replacement);
    }
  }

  const renderedXml = new XMLSerializer().serializeToString(xmlDocument);
  zip.file("word/document.xml", renderedXml);

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      delete zip.files[path];
    }
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
