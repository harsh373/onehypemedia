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
  "rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-50";

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
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handlePick}
        className="hidden"
      />

      {value ? (
        <div>
          <div
            className="w-full overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10"
            style={{ aspectRatio: COVER_ASPECT }}
          >
            <img
              src={value.previewUrl}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2 text-xs text-white/45">
            This is how the cover appears on the website.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={startRecrop} disabled={disabled} className={btn}>
              Crop
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className={btn}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className={`${btn} !text-red-400 hover:!bg-red-500/10`}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{ aspectRatio: COVER_ASPECT }}
          className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-white/25 text-sm font-semibold text-white/60 hover:border-white/50 hover:text-white disabled:opacity-50"
        >
          + Upload cover image
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

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