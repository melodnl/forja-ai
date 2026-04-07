/**
 * Workers BullMQ standalone — rodam via PM2 separado do Next.js.
 * Requerem Redis rodando (docker-compose up -d).
 *
 * TODO: Implementar workers de polling quando BullMQ + ioredis
 * forem configurados com Redis ativo.
 */

console.log("[workers] Forjea workers iniciados");
console.log("[workers] Aguardando configuração de Redis/BullMQ...");

// Manter processo vivo
setInterval(() => {}, 60_000);
