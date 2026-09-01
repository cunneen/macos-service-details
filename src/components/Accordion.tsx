import { ChevronDown } from "@gravity-ui/icons";
import { Accordion } from "@heroui/react";
import playButtonImg from "../assets/play-button.png";
import systemPreferencesImg from "../assets/system-preferences.png";
import extensionsImg from "../assets/system-information.png";

const items = [
  {
    content: "Login Items here",
    iconUrl: playButtonImg,
    subtitle: "These items open automatically when you login",
    title: "Login Items",
  },
  {
    content: "App Background Activity here",
    iconUrl: systemPreferencesImg,
    subtitle:
      "Apps run in the background after you close them to perform tasks such as checking for updates. Personal data and device sensors can be accessed by apps while they run in the background if you grant permission.",
    title: "App Background Activity",
  },
  {
    content: "Extensions Here",
    iconUrl: extensionsImg,
    subtitle:
      "Extensions add extra functionality to your Mac and apps, and some may run in the background.",
    title: "Extensions",
  },
];

export function AccordionExample() {
  return (
    <Accordion
      className="bg-surface-1/10 w-full max-w-md rounded-2xl"
      variant="surface"
    >
      {items.map((item, _index) => (
        <Accordion.Item
          key={item.title}
          className="group/item first:**:data-[slot=accordion-trigger]:rounded-t-2xl last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl"
        >
          <Accordion.Heading>
            <Accordion.Trigger className="group flex items-center gap-2 transition-none hover:bg-surface">
              {item.iconUrl ? (
                <img
                  alt={item.title}
                  className="h-11 w-11 transition-[scale,rotate] duration-300 ease-out group-hover/item:scale-120 group-hover/item:-rotate-10 group-hover/item:drop-shadow-lg"
                  src={item.iconUrl}
                />
              ) : null}
              <div className="flex flex-col gap-0">
                <span className="leading-5 font-medium">{item.title}</span>
                <span className="leading-6 font-normal text-muted/80">
                  {item.subtitle}
                </span>
              </div>
              <Accordion.Indicator className="text-muted/50 [&>svg]:size-4">
                <ChevronDown />
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="text-muted/80">
              {item.content}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
