import { useEffect, useRef } from "react";
import type QuillType from "quill";
import "quill/dist/quill.snow.css";
import "./CustomQuillEditor.css"; // optional styling below

type Props = {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export default function CustomQuillEditor({
  value = "",
  onChange,
  placeholder = "Write your message…",
  readOnly = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);

  useEffect(() => {
    let mounted = true;

    // Lazy import so Vite pre-bundling is less picky
    import("quill").then(({ default: Quill }) => {
      if (!mounted || !hostRef.current) return;

      if (!quillRef.current) {
        quillRef.current = new Quill(hostRef.current, {
          theme: "snow",
          placeholder,
          readOnly,
          modules: {
            toolbar: [
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image", "clean"],
            ],
          },
        });

        // set initial HTML
        if (value) {
          const root = quillRef.current.root as HTMLDivElement;
          root.innerHTML = value;
        }

        quillRef.current.on("text-change", () => {
          const html =
            (quillRef.current?.root as HTMLDivElement)?.innerHTML ?? "";
          onChange(html);
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [onChange, placeholder, readOnly]);

  // keep external value in sync (controlled)
  useEffect(() => {
    if (!quillRef.current) return;
    const root = quillRef.current.root as HTMLDivElement;
    if (root && root.innerHTML !== value) {
      root.innerHTML = value || "";
    }
  }, [value]);

  return <div className="pt-quillhost" ref={hostRef} />;
}
