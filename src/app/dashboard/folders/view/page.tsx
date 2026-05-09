import { Suspense } from "react";
import FolderContent from "./folder-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading folder...</div>}>
      <FolderContent />
    </Suspense>
  );
}
