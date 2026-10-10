export interface Capability {
  index: string
  title: string
  description: string
  services: string[]
}

export const CAPABILITIES: Capability[] = [
  {
    index: '01',
    title: 'BRAND',
    description: 'We shape brands people remember, from strategy to visual identity.',
    services: ['Brand Strategy', 'Brand Positioning', 'Brand Identity', 'Digital Branding'],
  },
  {
    index: '02',
    title: 'CREATE',
    description: 'Design, art direction and copy that make ideas impossible to ignore.',
    services: ['Content Design', 'Art Direction', 'Copywriting', 'Visual Systems'],
  },
  {
    index: '03',
    title: 'EXPERIENCE',
    description: 'Campaigns and live moments that bring a brand closer to its audience.',
    services: ['Campaigns', 'Activations', 'Social Experiences', 'Community'],
  },
  {
    index: '04',
    title: 'BUILD',
    description: 'Web design, development and tools that work as well as they look.',
    services: ['Web & Product Design', 'Development', 'Digital Tools', 'Technology Integration'],
  },
]