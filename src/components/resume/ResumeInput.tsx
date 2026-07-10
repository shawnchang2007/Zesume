"use client";

type ResumeInputProps = {
  value: string;
  characterMessage: string;
  maxLength: number;
  onChange: (value: string) => void;
};

export function ResumeInput({
  value,
  characterMessage,
  maxLength,
  onChange,
}: ResumeInputProps) {
  return (
    <>
      <div className="panel-header">
        <h2 className="panel-title">Resume Input</h2>
        <span className="counter">{characterMessage}</span>
      </div>
      <textarea
        className="resume-textarea"
        maxLength={maxLength + 500}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your resume text here, or upload a .txt / .docx file above."
        value={value}
      />
    </>
  );
}
