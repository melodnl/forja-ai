import { ForgeCanvas } from "@/components/canvas/ForgeCanvas";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      <ForgeCanvas boardId={id} />
    </div>
  );
}
