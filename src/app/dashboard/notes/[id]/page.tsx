import NoteContent from "./note-content";

export function generateStaticParams() {
  // We return an empty array because we'll handle the dynamic data on the client side
  // This allows the static export build to pass.
  return [];
}

export default function Page() {
  return <NoteContent />;
}
