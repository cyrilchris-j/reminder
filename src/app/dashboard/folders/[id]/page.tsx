import FolderContent from "./folder-content";

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function Page() {
  return <FolderContent />;
}
