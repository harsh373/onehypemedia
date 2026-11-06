import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ImageCropper from "./ImageCropper";
import {
  ACCEPTED_IMAGE_TYPES,
  GALLERY_ASPECT,
  MAX_GALLERY_IMAGES,
  cropToPreviewUrl,
  defaultCrop,
  imageUrl,
  loadImageSize,
  newKey,
  validateImageFile,
} from "../api/images";
import type { Crop, GalleryItem } from "../api/images";

type Props = {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  disabled?: boolean;
};

const smallBtn =
  "rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-white/15 disabled:opacity-50";

function releaseItem(item: GalleryItem) {
  if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
  if (item.kind === "new") URL.revokeObjectURL(item.sourceUrl);
}

async function prepareFile(file: File): Promise<GalleryItem> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const size = await loadImageSize(sourceUrl);
    const crop = defaultCrop(size.width, size.height, GALLERY_ASPECT);
    const previewUrl = await cropToPreviewUrl(sourceUrl, crop);
    return { key: newKey(), kind: "new", file, sourceUrl, crop, previewUrl };
  } catch (err) {
    URL.revokeObjectURL(sourceUrl);
    throw err;
  }
}

type TileProps = {
  item: GalleryItem;
  index: number;
  disabled: boolean;
  onCrop: () => void;
  onReplace: () => void;
  onDelete: () => void;
};

function Tile({ item, index, disabled, onCrop, onReplace, onDelete }: TileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
    >
      <div
        className="relative overflow-hidden bg-white/5"
        style={{ aspectRatio: GALLERY_ASPECT }}
      >
        <img
          src={item.previewUrl}
          alt={`Gallery image ${index + 1}`}
          draggable={false}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
          {index + 1}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          Drag
        </button>
        <button type="button" onClick={onCrop} disabled={disabled} className={smallBtn}>
          Crop
        </button>
        <button type="button" onClick={onReplace} disabled={disabled} className={smallBtn}>
          Replace
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function GalleryField({ items, onChange, disabled }: Props) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceKeyRef = useRef<string | null>(null);
  const itemsRef = useRef(items);
  const [cropKey, setCropKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const locked = Boolean(disabled) || busy;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(releaseItem);
    };
  }, []);

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_GALLERY_IMAGES - itemsRef.current.length;
    if (room <= 0) {
      setError(`A gallery can have at most ${MAX_GALLERY_IMAGES} images.`);
      return;
    }

    setError("");
    setBusy(true);

    const problems: string[] = [];
    if (files.length > room) {
      problems.push(
        `Only ${room} more image(s) can be added (max ${MAX_GALLERY_IMAGES}).`
      );
    }

    const added: GalleryItem[] = [];
    for (const file of files.slice(0, room)) {
      const problem = validateImageFile(file);
      if (problem) {
        problems.push(`${file.name}: ${problem}`);
        continue;
      }
      try {
        added.push(await prepareFile(file));
      } catch {
        problems.push(`${file.name}: could not be read.`);
      }
    }

    if (added.length > 0) onChange([...itemsRef.current, ...added]);
    if (problems.length > 0) setError(problems.join(" "));
    setBusy(false);
  }

  function pickReplace(key: string) {
    replaceKeyRef.current = key;
    replaceRef.current?.click();
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const key = replaceKeyRef.current;
    replaceKeyRef.current = null;
    if (!file || !key) return;

    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setBusy(true);
    try {
      const fresh = await prepareFile(file);
      const current = itemsRef.current;
      const index = current.findIndex((item) => item.key === key);
      if (index === -1) {
        releaseItem(fresh);
        return;
      }
      releaseItem(current[index]);
      const next = [...current];
      next[index] = fresh;
      onChange(next);
    } catch {
      setError("Could not read that image. Try another.");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(key: string) {
    const current = itemsRef.current;
    const target = current.find((item) => item.key === key);
    if (target) releaseItem(target);
    onChange(current.filter((item) => item.key !== key));
  }

  async function handleCropConfirm(crop: Crop) {
    const key = cropKey;
    setCropKey(null);
    const current = itemsRef.current;
    const item = current.find((i) => i.key === key);
    if (!item) return;

    try {
      let updated: GalleryItem;
      if (item.kind === "new") {
        const previewUrl = await cropToPreviewUrl(item.sourceUrl, crop);
        URL.revokeObjectURL(item.previewUrl);
        updated = { ...item, crop, previewUrl };
      } else {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
        updated = {
          ...item,
          crop,
          previewUrl: imageUrl({ url: item.url, crop }, 800),
        };
      }
      onChange(itemsRef.current.map((i) => (i.key === key ? updated : i)));
    } catch {
      setError("Could not create the preview. Try again.");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = itemsRef.current;
    const from = current.findIndex((item) => item.key === active.id);
    const to = current.findIndex((item) => item.key === over.id);
    if (from === -1 || to === -1) return;
    onChange(arrayMove(current, from, to));
  }

  const cropItem = items.find((item) => item.key === cropKey) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Event Photos</h2>
          <p className="text-sm text-white/45">
            {items.length} / {MAX_GALLERY_IMAGES}
          </p>
        </div>
        <button
          type="button"
          onClick={() => addRef.current?.click()}
          disabled={locked || items.length >= MAX_GALLERY_IMAGES}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/15 disabled:opacity-50"
        >
          {busy ? "Preparing photos..." : "+ Upload photos"}
        </button>
      </div>

      <input
        ref={addRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleAdd}
        className="hidden"
      />
      <input
        ref={replaceRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleReplace}
        className="hidden"
      />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-white/80">No photos yet</p>
          <p className="mt-1 text-sm text-white/50">Photos are optional.</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-white/45">
            Drag the Drag handle to reorder. The order here is the order on the
            website.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.key)}
              strategy={rectSortingStrategy}
            >
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {items.map((item, index) => (
                  <Tile
                    key={item.key}
                    item={item}
                    index={index}
                    disabled={locked}
                    onCrop={() => setCropKey(item.key)}
                    onReplace={() => pickReplace(item.key)}
                    onDelete={() => handleDelete(item.key)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      {cropItem && (
        <ImageCropper
          src={cropItem.kind === "new" ? cropItem.sourceUrl : cropItem.url}
          aspect={GALLERY_ASPECT}
          initialCrop={cropItem.crop}
          title="CROP PHOTO"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropKey(null)}
        />
      )}
    </div>
  );
}