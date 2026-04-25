import { useState } from 'react';
import useFeaturedSlots from '../hooks/useFeaturedSlots.js';
import FeaturedSlotsManager from './FeaturedSlotsManager.jsx';
import './FeaturedWidget.css';

function primaryImage(property) {
  if (!property?.images?.length) return null;
  const primary = property.images.find((i) => i.is_primary);
  return primary?.url || property.images[0]?.url || null;
}

export default function FeaturedWidget() {
  const controller = useFeaturedSlots();
  const [managerOpen, setManagerOpen] = useState(false);
  const { slots, loading } = controller;

  return (
    <section className="feat-widget">
      <div className="feat-widget__head">
        <div>
          <p className="feat-widget__eyebrow">On the homepage</p>
          <h2 className="feat-widget__title">Featured homes</h2>
        </div>
        <button
          type="button"
          className="feat-widget__manage"
          onClick={() => setManagerOpen(true)}
          disabled={loading}
        >
          Manage featured
        </button>
      </div>

      <ol className="feat-widget__strip">
        {slots.map((slot) => {
          const property = slot.property;
          const photo = primaryImage(property);
          return (
            <li
              key={slot.position}
              className={`feat-widget__slot ${property ? '' : 'feat-widget__slot--empty'}`}
            >
              <span className="feat-widget__pos">Slot {slot.position}</span>
              {property ? (
                <>
                  <div className="feat-widget__thumb">
                    {photo ? <img src={photo} alt="" /> : <span>&#x1f3e0;</span>}
                  </div>
                  <p className="feat-widget__title-line" title={property.title}>{property.title}</p>
                </>
              ) : (
                <p className="feat-widget__empty">Empty</p>
              )}
            </li>
          );
        })}
      </ol>

      <FeaturedSlotsManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        controller={controller}
      />
    </section>
  );
}
