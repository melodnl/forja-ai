import type { Node } from "@xyflow/react";

/** Extrai todos os @mentions de um prompt */
export function parseMentions(prompt: string): string[] {
  const matches = prompt.match(/@[\w-]+/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/** Resolve @mentions: coleta URLs de imagens dos nós mencionados */
export function resolveMentions(
  prompt: string,
  allNodes: Node[]
): { resolvedPrompt: string; mentionedImageUrls: string[]; hasAvatar: boolean; hasReference: boolean } {
  const mentions = parseMentions(prompt);
  const mentionedImageUrls: string[] = [];
  let hasAvatar = false;
  let hasReference = false;

  for (const label of mentions) {
    const node = allNodes.find((n) => {
      const nodeLabel = (n.data as Record<string, unknown>).label as string;
      return nodeLabel?.toLowerCase() === label.toLowerCase();
    });

    if (!node) continue;

    const data = node.data as Record<string, unknown>;

    if (node.type === "avatar") hasAvatar = true;
    if (node.type === "reference" || node.type === "image") hasReference = true;

    if (node.type === "reference" || node.type === "image" || node.type === "avatar") {
      if (data.url && typeof data.url === "string") {
        mentionedImageUrls.push(data.url);
      }
    }
  }

  return { resolvedPrompt: prompt, mentionedImageUrls, hasAvatar, hasReference };
}

/**
 * Quando o modelo é grok-img2img e o usuário referencia avatar + imagem,
 * gera um prompt otimizado para image-to-image que produz melhores resultados.
 */
export function buildImg2ImgPrompt(
  userPrompt: string,
  allNodes: Node[]
): string {
  const mentions = parseMentions(userPrompt);

  // Coletar info dos nós mencionados
  const avatarLabels: string[] = [];
  const refLabels: string[] = [];

  for (const label of mentions) {
    const node = allNodes.find((n) => {
      const nodeLabel = (n.data as Record<string, unknown>).label as string;
      return nodeLabel?.toLowerCase() === label.toLowerCase();
    });
    if (!node) continue;
    if (node.type === "avatar") avatarLabels.push(label);
    if (node.type === "reference" || node.type === "image") refLabels.push(label);
  }

  // Se tem avatar + referência, gerar prompt profissional
  if (avatarLabels.length > 0 && refLabels.length > 0) {
    return `Using @${refLabels[0]} as the base image, replace the person's face with the exact face from @${avatarLabels[0]}. Maintain identical: pose, body position, clothing, background, lighting, and composition. Only change the face — keep everything else pixel-perfect. The face must match the reference exactly: same bone structure, skin tone, facial features, expression style. Photorealistic result, no artifacts, seamless blend. ${userPrompt}`;
  }

  // Se só tem avatar, descrever baseado no avatar
  if (avatarLabels.length > 0) {
    return `Create a photorealistic image of the person from @${avatarLabels[0]} in this exact scene. Match their face precisely: bone structure, skin tone, features. ${userPrompt}`;
  }

  // Se só tem referência, usar como base
  if (refLabels.length > 0) {
    return `Using @${refLabels[0]} as reference, ${userPrompt}`;
  }

  return userPrompt;
}
