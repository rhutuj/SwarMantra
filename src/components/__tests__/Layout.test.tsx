import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../Layout'

describe('Layout', () => {
  it('renders the app title and children', () => {
    render(
      <MemoryRouter>
        <Layout>
          <p>Test content</p>
        </Layout>
      </MemoryRouter>
    )
    expect(screen.getByText('Swar Notebook')).toBeDefined()
    expect(screen.getByText('Test content')).toBeDefined()
  })
})
