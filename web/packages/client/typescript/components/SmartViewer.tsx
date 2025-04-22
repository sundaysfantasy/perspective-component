import * as React from "react";
import {
  ComponentMeta,
  ComponentProps,
  PComponent,
  PropertyTree,
  SizeObject,
} from "@inductiveautomation/perspective-client";

// din xeokit‑sdk
import {
  Viewer,
  XKTLoaderPlugin,
  AmbientLight,
  DirLight,
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

// ID‑ul unic al componentei în Perspective
export const COMPONENT_TYPE = "rad.display.smartViewer";

interface SmartViewerProps {
  source: string;
  backgroundColor: string;
}

const SmartViewer: React.FC<ComponentProps<SmartViewerProps>> = ({
  props,
  emit,
}) => {
  const { source, backgroundColor } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<{
    viewer: any;
    xktLoader: any;
  }>();

  // ─── INITIALIZARE ───
  React.useEffect(() => {
    if (!containerRef.current) return;

    // 1. Creăm canvas și îl inserăm în container
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    // 2. Instanțiem Viewer‑ul (webgl)
    const viewer = new Viewer({
      canvasElement: canvas,
      transparent: false,
      backgroundColor: [
        parseInt(backgroundColor.slice(1, 3), 16) / 255,
        parseInt(backgroundColor.slice(3, 5), 16) / 255,
        parseInt(backgroundColor.slice(5, 7), 16) / 255,
      ],
    });

    // 3. Gamma‑corectează scena
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    // 4. Adăugăm lumini
    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, {
      dir: [-0.5, -0.8, -0.3],
      color: [1, 1, 1],
      intensity: 1,
    });

    // 5. Plugin XKT pentru încărcare .xkt
    const xktLoader = new XKTLoaderPlugin(viewer);

    viewerRef.current = { viewer, xktLoader };

    return () => viewer.destroy();
  }, []); // doar la montare/demontare

  // ─── ÎNCĂRCARE MODEL ───
  React.useEffect(() => {
    const ctx = viewerRef.current;
    if (!ctx || !source) return;

    // Ștergem ce era (de ex. dacă s‑a schimbat source‑ul)
    ctx.viewer.scene.clear();

    // Încarcă modelul din /models/ în Ignition Webserver
    const model = ctx.xktLoader.load({
      id: "model",
      src: source || "/models/model.xkt",
      edges: true,
    });

    // Dacă s‑a încărcat sincron (cache), zboară camera spre AABB‑ul modelului
    if (model) {
      ctx.viewer.cameraFlight.flyTo({ aabb: model.aabb });
    }
  }, [source]);

  return (
    <div
      {...emit()}
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
};

// ─── META ───
export class SmartViewerMeta implements ComponentMeta {
  getComponentType() {
    return COMPONENT_TYPE;
  }
  getViewComponent(): PComponent {
    return SmartViewer;
  }
  getDefaultSize(): SizeObject {
    return { width: 400, height: 300 };
  }
  getPropsReducer(tree: PropertyTree): SmartViewerProps {
    return {
      source: tree.readString("source", ""),
      backgroundColor: tree.readString("backgroundColor", "#F0F0F0"),
    };
  }
}

export { SmartViewer };
