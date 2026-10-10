import { useRef, useState } from "react";
import ImageCropper from "./ImageCropper";
import {
  ACCEPTED_IMAGE_TYPES,
  COVER_ASPECT,
  cropToPreviewUrl,
  imageUrl,
  validateImageFile,
} from "../api/images";
import type { CoverState, Crop } from "../api/images";

type Pending = { src: string; file?: File; initialCrop?: Crop };

type Props = {
  value: CoverState;
  onChange: (value: CoverState) => void;
  disabled?: boolean;
};

const btn =
  "border border-neutral-950 px-4 py-2 text-xs font-semibold tracking-widest disabled:opacity-50";

function release(cover: CoverState) {
  if (!cover) return;
  if (cover.previewUrl.startsWith("blob:")) URL.revokeObjectURL(cover.previewUrl);
  if (cover.kind === "new") URL.revokeObjectURL(cover.sourceUrl);
}

export default function CoverImageField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState("");

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPending({ src: URL.createObjectURL(file), file });
  }

  function startRecrop() {
    if (!value) return;
    setPending({
      src: value.kind === "new" ? value.sourceUrl : value.url,
      initialCrop: value.crop,
    });
  }

  function handleCancel() {
    if (pending?.file) URL.revokeObjectURL(pending.src);
    setPending(null);
  }

  async function handleConfirm(crop: Crop) {
    if (!pending) return;
    try {
      if (pending.file) {
        const previewUrl = await cropToPreviewUrl(pending.src, crop);
        release(value);
        onChange({
          kind: "new",
          file: pending.file,
          sourceUrl: pending.src,
          crop,
          previewUrl,
        });
      } else if (value?.kind === "new") {
        const previewUrl = await cropToPreviewUrl(value.sourceUrl, crop);
        URL.revokeObjectURL(value.previewUrl);
        onChange({ ...value, crop, previewUrl });
      } else if (value?.kind === "existing") {
        onChange({
          ...value,
          crop,
          previewUrl: imageUrl({ url: value.url, crop }),
        });
      }
      setPending(null);
    } catch {
      setError("Could not create the preview. Try another image.");
      setPending(null);
    }
  }

  function handleDelete() {
    release(value);
    onChange(null);
  }

  return (
    <div>
      <span className="block text-xs font-semibold tracking-widest text-neutral-500">
        COVER IMAGE
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handlePick}
        className="hidden"
      />

      {value ? (
        <div className="mt-2">
          <div
            className="w-full max-w-xl overflow-hidden border border-neutral-200 bg-neutral-100"
            style={{ aspectRatio: COVER_ASPECT }}
          >
            <img
              src={value.previewUrl}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            This is how the cover will appear on the website.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={startRecrop} disabled={disabled} className={btn}>
              CROP
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className={btn}
            >
              REPLACE
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className={`${btn} !border-[#e31d25] text-[#e31d25]`}
            >
              DELETE
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{ aspectRatio: COVER_ASPECT }}
          className="mt-2 flex w-full max-w-xl items-center justify-center border-2 border-dashed border-neutral-300 text-sm font-semibold tracking-widest text-neutral-500 hover:border-neutral-950 disabled:opacity-50"
        >
          + UPLOAD COVER IMAGE
        </button>
      )}

      {error && <p className="mt-2 text-sm text-[#e31d25]">{error}</p>}

      {pending && (
        <ImageCropper
          src={pending.src}
          aspect={COVER_ASPECT}
          initialCrop={pending.initialCrop}
          title="CROP COVER"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}