import { Router } from 'express';
import { calculateEMI, generateAmortizationSchedule, calculateMaxEligibility } from '../services/EmiCalculator';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    agents: 7,
    uptime_s: Math.floor((Date.now() - startTime) / 1000),
  });
});

healthRouter.get('/emi-calculator', (req, res) => {
  const principal = Number(req.query.principal);
  const rate = Number(req.query.rate);
  const months = Number(req.query.months);
  const monthlyIncome = Number(req.query.monthly_income ?? 0);
  const existingEmis = Number(req.query.existing_emis ?? 0);

  if (!principal || !rate || !months) {
    res.status(400).json({ error: 'principal, rate, and months are required query parameters' });
    return;
  }
  if (principal <= 0 || rate <= 0 || months <= 0) {
    res.status(400).json({ error: 'All values must be positive' });
    return;
  }

  const emi = calculateEMI(principal, rate, months);
  const schedule = generateAmortizationSchedule(principal, rate, months);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  const maxEligibility = monthlyIncome > 0
    ? calculateMaxEligibility(monthlyIncome, existingEmis, rate, months)
    : null;

  res.json({
    emi,
    total_payment: totalPayment,
    total_interest: totalInterest,
    effective_rate: rate,
    schedule,
    max_eligibility: maxEligibility,
  });
});
