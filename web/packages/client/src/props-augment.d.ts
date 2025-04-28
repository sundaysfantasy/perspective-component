import "@inductiveautomation/perspective-client";

declare module "@inductiveautomation/perspective-client" {
  interface EmitProps {
    entityColors?: {
      id: string;
      color?: string;
      annotation?: { title?: string };
    }[];
  }
}
