import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} title="Test" onClose={() => {}}>
        <p>Content</p>
      </Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} title="Test Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeDefined()
    expect(screen.getByText('Modal content')).toBeDefined()
  })
})
