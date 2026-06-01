export const dummyFunnelData = [
  {
    block_order: 1,
    title: 'Welcome Message',
    message: 'Hi there! What would you like to do today?',
    options: [
      { id: 1, label: 'Learn about products', block: { id: 2, type: 'block' } },
      { id: 2, label: 'Contact support', block: { id: null, type: 'support' } },
    ],
  },
  {
    block_order: 2,
    title: 'Product Information',
    message: 'We offer a range of solutions for businesses and individuals.',
    options: [
      { id: 1, label: 'View pricing', block: { id: 3, type: 'block' } },
      { id: 2, label: 'See features', block: { id: 4, type: 'block' } },
    ],
  },
  {
    block_order: 3,
    title: 'Pricing',
    message: 'Our plans start at $9.99/month and go up based on your needs.',
    options: [{ id: 1, label: 'Go back', block: { id: 2, type: 'block' } }],
  },
  {
    block_order: 4,
    title: 'Features',
    message: 'We offer advanced analytics, custom branding, and more.',
    options: [
      { id: 1, label: 'Request demo', block: { id: 5, type: 'block' } },
      { id: 2, label: 'Go back', block: { id: 2, type: 'block' } },
    ],
  },
  {
    block_order: 5,
    title: 'Request Demo',
    message: 'Please provide your email so we can schedule a demo for you.',
    options: [
      { id: 1, label: 'Submit email', block: { id: 6, type: 'block' } },
      { id: 2, label: 'Go back', block: { id: 4, type: 'block' } },
    ],
  },
  {
    block_order: 6,
    title: 'Thank You',
    message: 'Thanks! We’ll be in touch shortly.',
    options: [],
  },
];
