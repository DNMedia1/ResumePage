describe('Portfolio – Smoke Tests', () => {
  beforeEach(() => {
    // Intro-Overlay überspringen: deterministische Tests, unabhängig von WebGL/Animation.
    cy.visit('/', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('intro-played', '1');
      },
    });
  });

  it('loads the page with hero section', () => {
    cy.get('.hero').should('be.visible');
    cy.get('.hero-content h1').should('exist');
  });

  it('has all navigation links', () => {
    cy.get('.topbar .navlinks a').should('have.length.at.least', 4);
  });

  it('has all main sections', () => {
    const sections = ['#about', '#tech', '#projects', '#experience', '#workflow', '#contact'];
    sections.forEach((id) => {
      cy.get(id).should('exist');
    });
  });

  it('has email contact link', () => {
    cy.get('a[href^="mailto:"]').should('exist');
  });

  it('has phone contact link', () => {
    cy.get('a[href^="tel:"]').should('exist');
  });
});
