import React, { useState } from 'react';
import ChartModal from '../ChartModal';

/**
 * Container component that wraps any chart and provides fullscreen functionality
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The chart component to render
 * @param {string} props.title - The chart title to display in the modal
 * @param {Function} props.renderChart - Function that renders the chart component with onClick prop
 */
export default function ChartContainer({ title, renderChart }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChartClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {renderChart({ onClick: handleChartClick })}
      
      <ChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={title}
      >
        {renderChart({ onClick: null })} {/* Pass null to disable click in modal */}
      </ChartModal>
    </>
  );
} 