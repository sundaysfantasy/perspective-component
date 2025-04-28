import "@inductiveautomation/perspective-client";

declare module "@inductiveautomation/perspective-client" {
  interface EmitProps {
    annotations?: {
      entityId: string;
      title: string;
    }[];
  }
}
