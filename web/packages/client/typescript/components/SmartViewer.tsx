import * as React from "react";
import {
  ComponentMeta,
  ComponentProps,
  PComponent,
  PropertyTree,
  SizeObject,
} from "@inductiveautomation/perspective-client";

// importăm NavCubePlugin din xeokit-sdk v2.6.0
import {
  Viewer,
  XKTLoaderPlugin,
  AmbientLight,
  DirLight,
  NavCubePlugin,
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

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

  React.useEffect(() => {
    if (!containerRef.current) return;

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    //canvas pentru navcube
    const navCubeCanvas = document.createElement("canvas");
    navCubeCanvas.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      width: 120px;
      height: 120px;
      z-index: 1000;
    `;
    containerRef.current.appendChild(navCubeCanvas);

    // Viewer WebGL
    const viewer = new Viewer({
      canvasElement: canvas,
      transparent: false,
      backgroundColor: [
        parseInt(backgroundColor.slice(1, 3), 16) / 255,
        parseInt(backgroundColor.slice(3, 5), 16) / 255,
        parseInt(backgroundColor.slice(5, 7), 16) / 255,
      ],
    });
    // Gamma corecție
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    // Lumini
    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, {
      dir: [-0.5, -0.8, -0.3],
      color: [1, 1, 1],
      intensity: 1,
    });


    // Plugin XKT Loader
    const xktLoader = new XKTLoaderPlugin(viewer);

    // ── instanţiere NavCubePlugin ──
    new NavCubePlugin(viewer, {
      canvasElement: navCubeCanvas,
      color: "lightblue",
      visible: true,
      cameraFly: true,
      cameraFitFOV: 45,
      cameraFlyDuration: 0.5,
    } as any);

    viewerRef.current = { viewer, xktLoader };

    return () => viewer.destroy();
  }, []); // numai la montare/demontare

  React.useEffect(() => {
    const ctx = viewerRef.current;
    if (!ctx || !source) return;

    //ctx.viewer.scene.clear();

    const model = ctx.xktLoader.load({
      id: "model",
      src: source,
      edges: true,
    });

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
