require('@testing-library/jest-dom');

jest.mock('lucide-react', () => {
  return new Proxy({}, {
    get: function(target, prop) {
      return () => <div data-testid={`mock-icon-${String(prop)}`} />;
    }
  });
});
