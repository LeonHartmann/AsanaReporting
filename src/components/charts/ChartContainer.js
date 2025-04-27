import React, { useState } from 'react';
import ChartModal from '../ChartModal';

/**
 * Container component that wraps any chart and provides fullscreen functionality
 * 
 * @param {Object} props
 * @param {string} props.title - The chart title to display in the modal
 * @param {Function} props.renderChart - Function that renders the chart component with onClick and isFullscreen props
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
      {/* Render normal sized chart */}
      {renderChart({ 
        onClick: handleChartClick, 
        isFullscreen: false 
      })}
      
      {/* Render fullscreen chart in modal */}
      <ChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={title}
      >
        {renderChart({ 
          onClick: null, 
          isFullscreen: true 
        })}
      </ChartModal>
    </>
  );
} 