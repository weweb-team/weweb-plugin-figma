# WeWeb Figma Plugin - Development Guidelines

## Icons (Iconify + Tailwind CSS 4)

Use dynamic Iconify classes: `icon-[prefix--name]`

**Available icon sets:**
- `ph` - Phosphor icons
- `lucide` - Lucide icons
- `carbon` - Carbon icons

**Examples:**
```html
<span class="icon-[lucide--bug] size-4" />
<span class="icon-[ph--magic-wand-bold] size-5 text-primary" />
<span class="icon-[carbon--copy] size-4 animate-spin" />
```

## UI Components (shadcn-vue)

**Available components:**
- `Button` - Primary UI button with variants
- `Switch` - Toggle switch (styled to match WeWeb)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation

**Button variants:** `default`, `brand`, `binding`, `success`, `warning`, `alert`

## Styling

- Use Tailwind utility classes (avoid custom CSS)
- Follow WeWeb design system colors (see src/styles.css)
- Dark mode: Components auto-adapt via CSS variables

## Testing

- Test setup file: `__test__/setup.ts` - Contains Figma API mocks
- Run tests: `pnpm test`
- Update snapshots: `pnpm test -u`
- Type checking: `pnpm run typecheck`
