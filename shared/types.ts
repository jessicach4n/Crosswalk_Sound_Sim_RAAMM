export type Role = "controller" | "speakerA" | "speakerB";

export type JoinPayload = {
  room: string;
  role: Role;
};

export type Room = {
  controller?: any;
  speakerA?: any;
  speakerB?: any;
};