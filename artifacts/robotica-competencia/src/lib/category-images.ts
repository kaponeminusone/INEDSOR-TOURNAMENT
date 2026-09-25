import lineFollower from "@assets/generated_images/inedsor-seguidor-de-linea.jpg";
import minisumo from "@assets/generated_images/inedsor-minisumo.jpg";
import sumo from "@assets/generated_images/inedsor-sumo.jpg";
import soccer from "@assets/generated_images/inedsor-soccer-rc.jpg";
import drone from "@assets/generated_images/inedsor-pista-dron.jpg";
import balloons from "@assets/generated_images/inedsor-explotaglobos.jpg";
import remoteSumo from "@assets/generated_images/inedsor-sumo-rc.jpg";
import remoteCircuit from "@assets/generated_images/inedsor-circuito-rc.jpg";
import maze from "@assets/generated_images/inedsor-laberinto.jpg";

export const categoryImages: Record<string, string> = {
  "seguidor-de-linea": lineFollower,
  minisumo,
  sumo,
  futbolito: soccer,
  "circuito-dron": drone,
  explotaglobos: balloons,
  "sumo-rc": remoteSumo,
  "carrera-rc": remoteCircuit,
  "laberinto-rc": maze,
};