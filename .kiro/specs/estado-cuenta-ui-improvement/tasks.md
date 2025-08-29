# Implementation Plan

- [x] 1. Fix estado-cuenta.page.html header layout and structure



  - Remove redundant `ion-header collapse="condense"` element that causes overlap
  - Replace `ion-menu-button` with `ion-back-button` for consistency with consulta-ics
  - Clean up header CSS classes to use standard safe-area pattern
  - Update container structure to use centered layout like consulta-ics
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ] 2. Enhance estado-cuenta.page.html search interface
  - Replace basic search form with modern search card design from consulta-ics
  - Add search icon and styled title matching consulta-ics pattern
  - Apply consistent gradient background and shadow styling
  - Implement proper spacing and typography for search section
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2_

- [ ] 3. Fix estado-cuenta-amnistia.page.html header layout and structure  
  - Remove redundant header elements causing visual clutter
  - Replace `ion-menu-button` with `ion-back-button` for navigation consistency
  - Apply same header structure and CSS classes as consulta-ics
  - Update container layout to use centered design pattern
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [ ] 4. Enhance estado-cuenta-amnistia.page.html search interface
  - Implement modern search card design matching consulta-ics style
  - Add proper search section header with icon and title
  - Apply consistent styling for gradient background and shadows
  - Update spacing and typography to match design standards
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2_

- [ ] 5. Standardize content spacing and layout across both pages
  - Apply consistent margins and padding to content sections
  - Ensure proper spacing between search form and results
  - Update glass-card styling to match consulta-ics patterns
  - Implement uniform spacing for mobile and desktop viewports
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

- [ ] 6. Update CSS classes and remove redundant styles
  - Remove page-specific CSS classes that duplicate consulta-ics functionality
  - Consolidate styling to reuse existing consulta-ics CSS patterns
  - Clean up inline styles and move to consistent class-based approach
  - Ensure responsive design works properly on all screen sizes
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [ ] 7. Test and validate layout improvements
  - Verify header layout is clean and consistent across both pages
  - Test navigation functionality with new back button implementation
  - Validate responsive behavior on mobile, tablet, and desktop
  - Ensure all existing functionality (search, print, selection) still works
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2, 4.3_