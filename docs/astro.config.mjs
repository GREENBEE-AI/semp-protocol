import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.selsemp.dev',
  integrations: [
    starlight({
      title: 'SEMP Protocol',
      logo: {
        src: './src/assets/logo.png',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/selsemp/semp-protocol' },
      ],
      sidebar: [
        { label: 'Getting Started', slug: 'getting-started' },
        {
          label: 'Protocol',
          autogenerate: { directory: 'protocol' },
        },
        {
          label: 'Connectors',
          autogenerate: { directory: 'connectors' },
        },
        { label: 'Architecture', slug: 'architecture' },
        { label: 'Examples', slug: 'examples' },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
