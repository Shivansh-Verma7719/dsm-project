"use client";

import React, { useState, useEffect } from "react";
import { Card, Slider, Separator, ProgressBar, Select, Label, ListBox } from "@heroui/react";

export function PredictionSimulator() {
  const [inputs, setInputs] = useState({
    monthly_income_rs: 50000,
    education_years: 15,
    is_urban: 1.0,
    gender: 1.0,
    risk_tolerance_preference: 3.0,
    stock_market_familiarity: 3.0,
    actual_knowledge_score: 5.0,
    info_social_media: 0.0,
    info_professionals: 1.0,
  });

  const [predictions, setPredictions] = useState({
    participation_probability: 0,
    securities_probability: 0,
    long_term_duration_probability: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Debounce the fetch slightly to avoid spamming the backend on slider drag
    const timeoutId = setTimeout(() => {
      fetchPredictions();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputs]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data) setPredictions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls */}
      <Card className="lg:col-span-2 shadow-sm border-1 border-divider">
        <Card.Header className="px-6 py-4 border-b border-divider bg-content2/50">
          <h3 className="text-xl font-semibold">Household Profile Inputs</h3>
        </Card.Header>
        <Card.Content className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Socioeconomic Factors</h4>
            
            <Slider 
              step={5000} 
              maxValue={200000} 
              minValue={5000} 
              value={inputs.monthly_income_rs} 
              onChange={(v) => handleChange("monthly_income_rs", v)}
              formatOptions={{style: "currency", currency: "INR"}}
              className="max-w-md"
            >
              <Label>Monthly Income (₹)</Label>
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            <Slider 
              step={1} 
              maxValue={20} 
              minValue={0} 
              value={inputs.education_years} 
              onChange={(v) => handleChange("education_years", v)}
              className="max-w-md"
            >
              <Label>Years of Education</Label>
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Select 
                className="w-full"
                value={String(inputs.is_urban)} 
                onChange={(key) => handleChange("is_urban", key)}
              >
                <Label>Location</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Urban">
                      Urban
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="0" textValue="Rural">
                      Rural
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select 
                className="w-full"
                value={String(inputs.gender)} 
                onChange={(key) => handleChange("gender", key)}
              >
                <Label>Gender</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Male">
                      Male
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="0" textValue="Female">
                      Female
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary">Behavioral Factors</h4>
            
            <Slider 
              step={1} 
              maxValue={9} 
              minValue={0} 
              value={inputs.actual_knowledge_score} 
              onChange={(v) => handleChange("actual_knowledge_score", v)}
              className="max-w-md"
            >
              <Label>Actual Financial Literacy Score</Label>
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            <Slider 
              step={1} 
              maxValue={5} 
              minValue={1} 
              value={inputs.stock_market_familiarity} 
              onChange={(v) => handleChange("stock_market_familiarity", v)}
              className="max-w-md"
            >
              <Label>Self-Perceived Familiarity</Label>
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Select 
                className="w-full"
                value={String(inputs.info_social_media)} 
                onChange={(key) => handleChange("info_social_media", key)}
              >
                <Label>Relies on Social Media</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Yes (Finfluencers)">
                      Yes (Finfluencers)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="0" textValue="No">
                      No
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select 
                className="w-full"
                value={String(inputs.info_professionals)} 
                onChange={(key) => handleChange("info_professionals", key)}
              >
                <Label>Relies on Professionals</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Yes (Advisors)">
                      Yes (Advisors)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="0" textValue="No">
                      No
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Outputs */}
      <Card className="bg-primary/5 border-1 border-primary/20 shadow-lg">
        <Card.Header className="px-6 py-4 border-b border-primary/10">
          <h3 className="text-xl font-semibold text-primary">Live Predictions</h3>
        </Card.Header>
        <Card.Content className="p-6 space-y-8">
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="font-medium text-sm">Market Participation Probability</span>
              <span className="font-bold text-2xl text-primary">{(predictions.participation_probability * 100).toFixed(1)}%</span>
            </div>
            <ProgressBar 
              value={predictions.participation_probability * 100} 
              className="h-3"
              isIndeterminate={loading}
              aria-label="Market Participation Probability"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-xs text-default-500">Likelihood of holding ANY securities.</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="font-medium text-sm">Securities Choice (Market-Linked)</span>
              <span className="font-bold text-2xl text-secondary">{(predictions.securities_probability * 100).toFixed(1)}%</span>
            </div>
            <ProgressBar 
              value={predictions.securities_probability * 100} 
              color="accent" 
              className="h-3"
              isIndeterminate={loading}
              aria-label="Securities Choice"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-xs text-default-500">Likelihood of holding Equity/MF vs traditional instruments.</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="font-medium text-sm">Long-Term Holding Horizon</span>
              <span className="font-bold text-2xl text-success">{(predictions.long_term_duration_probability * 100).toFixed(1)}%</span>
            </div>
            <ProgressBar 
              value={predictions.long_term_duration_probability * 100} 
              color="success" 
              className="h-3"
              isIndeterminate={loading}
              aria-label="Long-Term Holding Horizon"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-xs text-default-500">Likelihood of defining equity holdings as &gt;3 years.</p>
          </div>

        </Card.Content>
      </Card>
    </div>
  );
}
