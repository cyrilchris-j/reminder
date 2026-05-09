import { Suspense } from "react";
import NoteContent from "./note-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NoteContent />
    </Suspense>
  );
}
