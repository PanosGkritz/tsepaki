type Listener = () => void;

const listeners = new Set<Listener>();

export const onDataChanged = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyDataChanged = () => {
  listeners.forEach((listener) => listener());
};