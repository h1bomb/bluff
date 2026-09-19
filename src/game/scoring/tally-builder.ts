import { ScoreTallyStep } from './types';

export class ScoreTallyBuilder {
  private steps: ScoreTallyStep[] = [];
  
  constructor(
    public currentChips: number = 0,
    public currentMult: number = 0,
    public currentCognitiveMult: number = 1.0
  ) {}

  public addStep(
    stepParams: Omit<ScoreTallyStep, 'currentChips' | 'currentMult' | 'currentCognitiveMult'>
  ) {
    if (stepParams.chipsAdded) this.currentChips += stepParams.chipsAdded;
    if (stepParams.multAdded) this.currentMult += stepParams.multAdded;
    if (stepParams.xMult) this.currentMult = Math.round(this.currentMult * stepParams.xMult);
    if (stepParams.cognitiveMult) this.currentCognitiveMult = stepParams.cognitiveMult;

    this.steps.push({
      ...stepParams,
      currentChips: this.currentChips,
      currentMult: this.currentMult,
      currentCognitiveMult: this.currentCognitiveMult,
    });
  }

  public getSteps(): ScoreTallyStep[] {
    return this.steps;
  }
}
