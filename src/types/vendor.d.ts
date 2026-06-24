/** Socket.io client carregado via CDN no index.html. */
declare const io: (...args: unknown[]) => {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
};
