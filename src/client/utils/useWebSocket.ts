import { useState, useEffect } from 'react';

const useWebSocket = (
  url: string,
  options: { enabled: boolean } = { enabled: true }
) => {
  const [message, setMessage] = useState<{ data: string }>();

  useEffect(() => {
    if (!options.enabled) return;

    const socket = new WebSocket(url);

    socket.addEventListener('message', (event) => {
      setMessage(event);
    });

    return () => {
      socket.close();
    };
  }, [url, options.enabled]);

  return message;
};

export default useWebSocket;
