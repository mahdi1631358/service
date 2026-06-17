import { MemoryRouter } from 'react-router-dom';
import { ServisyarPrototype } from "./servisyar-prototype.js";
    
export const ServisyarPrototypeBasic = () => {
  return (
    <MemoryRouter>
      <ServisyarPrototype />
    </MemoryRouter>
  );
}