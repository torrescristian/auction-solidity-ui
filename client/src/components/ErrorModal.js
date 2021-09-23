import React from 'react';
import { Header, Modal } from 'semantic-ui-react'

function ErrorModal({ open, setOpen, message }) {
  return (
    <Modal
      closeIcon
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
    >
      <Header icon='ban' content='Error' color='red' />
      <Modal.Content>
        <p>
          {message}
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default ErrorModal;
