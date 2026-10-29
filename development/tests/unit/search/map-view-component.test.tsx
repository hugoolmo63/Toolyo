// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapView } from "@/features/search/presentation/map-view";
import type { MapPin } from "@/types/search";

const map = { fitBounds: vi.fn(), setView: vi.fn() };

vi.mock("react-leaflet", async () => {
  const React = await import("react");
  return {
    MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TileLayer: () => null,
    Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => <div data-testid="map-marker" data-position={position.join(",")}>{children}</div>,
    Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useMap: () => map,
  };
});

vi.mock("leaflet", () => ({
  default: { Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } } },
}));

vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
}));

const pins = Array.from({ length: 90 }, (_, index): MapPin => ({
  id: `listing-${index}`,
  lat: 40 + index / 1000,
  lng: -3 - index / 1000,
  title: `Producto ${index}`,
  pricePerDay: 12,
  primaryPhotoUrl: null,
  ratingAverage: 0,
}));

describe("MapView markers", () => {
  afterEach(() => {
    cleanup();
    map.fitBounds.mockClear();
    map.setView.mockClear();
  });

  it("renders one marker per coordinate-bearing search result and fits all points", async () => {
    render(<MapView center={null} pins={pins} isLoading={false} />);

    await waitFor(() => expect(screen.getAllByTestId("map-marker")).toHaveLength(90));
    await waitFor(() =>
      expect(map.fitBounds).toHaveBeenCalledWith(
        pins.map((pin) => [pin.lat, pin.lng]),
        { padding: [32, 32], maxZoom: 14 },
      ),
    );
  });

  it("links the marker popup to the detail route using the actual listing id", async () => {
    render(<MapView center={null} pins={[pins[0]!]} isLoading={false} />);

    const link = await screen.findByRole("link", { name: "Ver Producto 0" });
    fireEvent.click(link);
    expect(link.getAttribute("href")).toBe("/listings/listing-0");
  });
});