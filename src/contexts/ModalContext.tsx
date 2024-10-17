import React, { createContext, useState, useContext } from 'react';
import CreatePollModal from '../components/CreatePollModal';

type ModalType = 'createPoll' | null;

interface ModalContextProps {
  modalType: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextProps>({
  modalType: null,
  openModal: () => {},
  closeModal: () => {},
});

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setModalType(type);
  const closeModal = () => setModalType(null);

  const renderModal = () => {
    switch (modalType) {
      case 'createPoll':
        return <CreatePollModal />;
      default:
        return null;
    }
  };

  return (
    <ModalContext.Provider value={{ modalType, openModal, closeModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
