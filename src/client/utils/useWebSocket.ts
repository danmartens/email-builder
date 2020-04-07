import { useState, useEffect } from 'react';

const useWebSocket = (url: string) => {
  const [message, setMessage] = useState<{ data: string }>();

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.addEventListener('message', (event) => {
      setMessage(event);
    });

    return () => {
      socket.close();
    };
  }, []);

  return message;
};

export default useWebSocket;
